
/**
 * @doc Webhooks
 * @desc Processes incoming webhook payload from the rabbitMQ queue and assigns disputes to staff members.
 * 
 * Assigns a dispute to a staff member using a round-robin algorithm.
 *
 * Steps:
 * 1. If no staff assignment state exists for the merchant, assign the dispute to the first staff member and create the state.
 * 2. If a state exists, determine the next staff member in the list after the last assigned one.
 * 3. Update the dispute's staff assignment.
 * 4. Update the staff assignment state to reflect the new last assigned staff.
 * 5. All operations are performed within a transaction for consistency.
 *
 * @async
 * @function AssignedDisputeToStaff
 * @param {Object} params - The parameters object.
 * @param {Array<number>} params.ids - Array of staff member IDs.
 * @param {number} params.merchantId - The merchant's internal ID.
 * @param {number} params.disputeId - The dispute's internal ID.
 * @param {Object|null} params.staffState - The current staff assignment state, or null if not set.
 * @param {Object} params.t - The Sequelize transaction object.
 * @returns {Promise<number>} The ID of the staff member assigned to the dispute.
 * @throws {AppError} If any database operation fails.
 */

/**
 * Processes a webhook payload to create or update a dispute record.
 *
 * Steps:
 * 1. Extract business ID, raw payload, headers, and client IP from the message payload.
 * 2. Validate the business ID for presence and format.
 * 3. Verify the merchant exists in the database.
 * 4. Save the incoming payload for record-keeping.
 * 5. Detect the payment gateway from headers and payload.
 * 6. Parse the gateway payload using the orchestrator layer.
 * 7. Normalize the parsed payload to a standard format.
 * 8. Validate the normalized payload schema.
 * 9. Check for duplicate disputes by dispute ID and businessId.
 * 10. If the dispute exists:
 *     - Update dispute fields and create a history record.
 *     - Assign staff if not already assigned, using round-robin.
 *     - Generate and queue notifications for staff and businessId.
 * 11. If the dispute does not exist:
 *     - Create a new dispute and history record.
 *     - Assign staff if available, using round-robin.
 *     - Generate and queue notifications for staff and businessId.
 * 12. Bulk create notifications.
 * 13. Commit the transaction if all steps succeed.
 * 14. Log the operation in the dispute log.
 * 15. On error, rollback the transaction and log the failure.
 *
 * @async
 * @function ProcessWebhookPayload
 * @param {Object} msgPayload - The payload received from the message queue.
 * @param {string} msgPayload.merchantId - The merchant's external ID.
 * @param {Object} msgPayload.rawPayload - The raw webhook payload from the gateway.
 * @param {Object} [msgPayload.headers] - Optional HTTP headers from the webhook.
 * @param {string} [msgPayload.GatewayIP] - Optional client IP address.
 * @returns {Promise<Object>} The created or updated dispute instance.
 * @throws {AppError} If any validation or database operation fails.
 */

import _ from 'lodash';
import AppErrorCode from '../../constants/app-error-codes.constant.js';
import statusCodes from '../../constants/status-codes.constant.js';
import Merchant from '../../models/merchant.model.js';
import AppError from '../../utils/app-error.util.js';
import { DetectPaymentGateway, generateDisputeNotificationTemplate, OrchestratorGatewayParser } from './webhook-helpers.js';
import Dispute from '../../models/dispute.model.js';
import { uniqueDisputeId } from '../../utils/generate-ids.util.js';
import Analyst from '../../models/analyst.model.js';
import StaffAssignmentState from '../../models/staff-assign-state.model.js';
import { normalizePayloadSchema } from '../../utils/yup-schema.util.js';
import sequelize from '../../config/database.config.js';
import DisputeLog from '../../models/dispute-log.model.js';
import Payload from '../../models/payload.model.js';
import Notification from '../../models/notification.model.js';
import DisputeNotifyStatus from '../../constants/dispute-notify-status.constant.js';
import Business from '../../models/business.model.js';


// Round Robbin Algorithm to Assign Dispute to Staff
const AssignedDisputeToStaff = async ({ ids, merchantId, disputeId, staffState, t }) => {
    try {
        const updates = [];
        let state = staffState;
        let nextStaffId;
        let isFirst = false;
        if (!state) {
            const firstStaffId = ids[0];
            updates.push(
                StaffAssignmentState.create({
                    merchantId: merchantId,
                    lastStaffAssigned: firstStaffId
                }, { transaction: t })
            )
            isFirst = true;
            nextStaffId = firstStaffId;
        } else {
            const lastAssignedId = state.lastStaffAssigned;
            const lastIndex = ids.indexOf(lastAssignedId);
            const nextIndex = (lastIndex + 1) % ids.length;
            nextStaffId = ids[nextIndex];
        }
        updates.push(
            Dispute.update(
                { analystId: nextStaffId },
                {
                    where: { id: disputeId },
                    transaction: t
                },
            )
        );
        if (!isFirst) {
            updates.push(
                StaffAssignmentState.update(
                    { lastStaffAssigned: nextStaffId },
                    {
                        where: { merchantId: merchantId },
                        transaction: t
                    }
                )
            );
        }
        await Promise.all(updates);

        return nextStaffId;
    }
    catch (error) {
        throw new AppError(statusCodes.BAD_REQUEST, error?.message);
    }
}

const ProcessWebhookPayload = async (msgPayload) => {

    // @desc : Process the Webhook Payload and Store Dispute in DB
    // @param : msgPayload - The payload received from the message queue
    const logPayload = {
        merchantId: "",
        businessId: "",
        log: "",
        gateway: null,
        ipAddress: null,
        eventType: null,
        disputeId: null,
        paymentId: null,
        statusUpdatedAt: null,
        dueDate: null,
        payloadId: null,
    }

    const t = await sequelize.transaction(); // start a transaction

    // @desc : Receive Dispute From Payment Gateway and Store It And Notify Merchant or Staff
    try {

        // Step 1  : Extract the Gateway Data and MerchantId
        const businessId = msgPayload.businessId;
        const rawPayload = msgPayload.rawPayload;
        const headers = msgPayload?.headers;
        const clientIp = msgPayload?.GatewayIP;

        logPayload.ipAddress = clientIp;

        // Step 2  : Validate MerchantId is Valid or not

        // 2.1 : Check id must not Empty
        if (_.isEmpty(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('businessId'));
        }

        // 2.2 : Check for valid id Format
        if (businessId?.length !== 15 || businessId.slice(0, 3) !== 'BIZ') {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('BusinessId'))
        }

        // 2.3 : Check Merchant is Exist or not
        const businessAccount = await Business.findOne({ where: { customBusinessId: businessId }, attributes: ['id', 'merchantId'], transaction: t, raw: true });
        if (_.isEmpty(businessAccount)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Business'));
        }
        if (_.isEmpty(businessAccount.merchantId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Merchant'));
        }
        logPayload.merchantId = businessAccount.merchantId;
        logPayload.businessId = businessAccount.id;

        // Step 3 : Saving incoming payload for Record Update
        const payload = await Payload.create({
            merchantId: businessAccount.merchantId,
            businessId: businessAccount.id,
            payloadType: 'webhook',
            rawPayload: JSON.stringify({
                merchantId: businessAccount.merchantId,
                businessId: businessAccount.id,
                ipAddress: clientIp,
                headers: headers,
                body: rawPayload
            })
        });
        if (_.isEmpty(payload)) {
            logPayload.log = 'Failed to Add Gateway Payload';
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Gateway Payload'));
        }
        logPayload.payloadId = payload?.id;

        // Step 4  : Detect Payment Gateway
        const Gateway = DetectPaymentGateway(headers, rawPayload);
        if (_.isEmpty(Gateway)) {
            logPayload.log = 'Dispute : Failed to Detect Gateway';
            throw new AppError(statusCodes.BAD_REQUEST, 'unknown detect');
        }
        logPayload.gateway = Gateway;


        // Step 5  : Parse the Gateway Payload ==> Orchestrator Layer
        const parsePayload = OrchestratorGatewayParser(Gateway, rawPayload);

        if (_.isEmpty(parsePayload)) {
            logPayload.log = `Dispute : Failed to Parse ${Gateway} Gateway Payload`;
            throw new AppError(statusCodes.BAD_REQUEST, 'Unsupported Gateway Payload :' + Gateway);
        }

        // Step 6  : Normalize the Gateway Payload  ==> Adaptor Layer

        // 6.1 : Payload structure
        const normalizePayload = {
            disputeId: parsePayload?.disputeId,
            paymentId: parsePayload?.paymentId,
            gateway: Gateway,
            ipAddress: clientIp,
            amount: parsePayload?.amount,
            currency: parsePayload?.currency,
            reasonCode: parsePayload?.reasonCode,
            reason: parsePayload?.reasonDescription,
            status: parsePayload?.status,
            event: parsePayload?.event,
            statusUpdatedAt: parsePayload?.statusUpdatedAt,
            dueDate: parsePayload?.dueDate,
            type: parsePayload?.type,
            state: parsePayload?.state,
        }

        // 7 : validate payload format
        try {
            await normalizePayloadSchema.validate(normalizePayload, { abortEarly: false });
        } catch (error) {
            throw new AppError(statusCodes.BAD_REQUEST, error?.errors?.[0] || error?.message);
        }

        logPayload.merchantId = businessAccount.merchantId;
        logPayload.gateway = Gateway;
        logPayload.ipAddress = clientIp;

        // Step 8  : Check For Duplicate Disputes
        if (_.isEmpty(normalizePayload?.disputeId)) {
            logPayload.log = 'Dispute : Failed to Get the Dispute from Gateway';
            throw new AppError(statusCodes.BAD_REQUEST, 'Failed to Get disputeId');
        }
        const bisId = businessId?.split('Z')?.[1]?.slice(0, 2);

        let [dispute, customId, staffMembers, staffAssignmentState] = await Promise.all([
            // 1 . Fetch the Dispute Exist Or Not
            Dispute.findOne({
                where: { disputeId: normalizePayload?.disputeId, merchantId: businessAccount.merchantId },
                attributes: ['id', 'analystId', 'customId', 'disputeId', 'paymentId', 'ipAddress', 'status', 'event', 'statusUpdatedAt', 'dueDate', 'type', 'state'],
                transaction: t
            }),

            // 2 . Generate Unique id for Dispute
            uniqueDisputeId(bisId, t),

            // 3. Fetch Merchant Analyst
            Analyst.findAll({
                where: { merchantId: businessAccount.merchantId, status:"ACTIVE" },
                attributes: ['id', 'firstName', 'lastName', 'createdAt'],
                transaction: t,
                raw: true,
            }),

            // 4. Fetch the State of Staff To Get the Next Staff index to Assign Dispute
            StaffAssignmentState.findOne({
                where: { merchantId: businessAccount.merchantId },
                attributes: ['id', 'lastStaffAssigned'],
                lock: t.LOCK.UPDATE,  // use lock WITHIN parent transaction
                transaction: t,
                raw: true
            })
        ]);
        logPayload.payloadId = payload?.id;
        const isExist = !!dispute;

        // Step 9  : Store or Update Dispute history Record
        const notify = [];
        if (isExist) {

            // Update the dispute history
            dispute.ipAddress = normalizePayload?.ipAddress;
            dispute.status = normalizePayload?.status;
            dispute.event = normalizePayload?.event;
            dispute.statusUpdatedAt = normalizePayload?.statusUpdatedAt;
            dispute.dueDate = normalizePayload?.dueDate;
            dispute.type = normalizePayload?.type;
            dispute.state = normalizePayload?.state;

            logPayload.disputeId = dispute?.disputeId;
            logPayload.eventType = dispute?.event;
            logPayload.statusUpdatedAt = dispute?.statusUpdatedAt;
            logPayload.dueDate = dispute?.dueDate;
            logPayload.paymentId = dispute?.paymentId || normalizePayload?.paymentId;

            const [disputeData, historyRecord] = await Promise.all([
                // 1. Save Updated Dispute
                dispute.save({ transaction: t }),

                // 2. Create History record for Dispute
                dispute.createDisputeHistory({
                    merchantId: businessAccount.merchantId,
                    disputeId: dispute?.id,
                    updatedStatus: normalizePayload?.status,
                    updatedEvent: normalizePayload?.event,
                    statusUpdateAt: normalizePayload?.statusUpdatedAt,
                    payloadId: payload?.id
                }, {
                    transaction: t
                })
            ]);
            dispute = disputeData;

            // Validate Record is Created or Not
            if (_.isEmpty(historyRecord)) {
                logPayload.log = `Dispute : Failed to Update ${dispute.customId} Status`;
                throw new AppError(statusCodes.BAD_REQUEST, 'Failed to Update Dispute History Status');
            }

            if (!_.isEmpty(staffMembers) && !dispute?.analystId) {
                // Assign Dispute to Staff Using Round Robbin Algorithm

                // Round Robbin with race condition prevention 
                const analysts = staffMembers.sort((analyst1, analyst2) => new Date(analyst1?.createdAt) - new Date(analyst2?.createdAt));
                let ids = analysts?.map((staff) => staff?.id);
                // ids.sort((a, b) => a - b);
                if (ids.length > 0) {

                    // Payload to Assigned Staff
                    const assignedPayload = {
                        ids,
                        merchantId: businessAccount.merchantId,
                        disputeId: dispute?.id,
                        staffState: staffAssignmentState,
                        t: t
                    }

                    // Service to Assign Staff In Order using Round Robbin Algorithm
                    const nextStaffId = await AssignedDisputeToStaff(assignedPayload);

                    const nextStaff = staffMembers.find((staff) => staff?.id === nextStaffId);
                    const staffName = `${nextStaff?.firstName} ${nextStaff?.lastName}`;
                    dispute.analystId = nextStaffId;

                    // Generate Notification Templates For Users
                    const { title, message } = generateDisputeNotificationTemplate(customId, DisputeNotifyStatus.ASSIGNED, staffName, {});
                    notify.push({
                        recipientId: nextStaffId,
                        recipientType: 'ANALYST',
                        businessId: businessAccount.id,
                        type: 'DISPUTE',
                        title,
                        message,
                        disputeId: dispute.id,
                        isRead: false,
                        channel: 'WEB'
                    });

                    const { title: title2, message: message2 } = generateDisputeNotificationTemplate(dispute.customId, DisputeNotifyStatus.EVENT_CHANGED_ASSIGNED_STAFF, staffName, { newStatus: dispute.status });
                    notify.push({
                        recipientId: businessAccount.merchantId,
                        recipientType: 'MERCHANT',
                        businessId: businessAccount.id,
                        type: 'DISPUTE',
                        title: title2,
                        message: message2,
                        disputeId: dispute.id,
                        isRead: false,
                        channel: 'WEB'
                    });
                }
            }
            else {
                // If Staff Is Attached to Dispute
                if (dispute?.analystId) {
                    const { title, message } = generateDisputeNotificationTemplate(dispute.customId, DisputeNotifyStatus.EVENT_CHANGED, '', { newStatus: dispute.status });
                    notify.push({
                        recipientId: dispute?.analystId,
                        recipientType: 'ANALYST',
                        businessId: businessAccount.id,
                        type: 'DISPUTE',
                        title,
                        message,
                        disputeId: dispute.id,
                        isRead: false,
                        channel: 'WEB'
                    });
                    const { title: title2, message: message2 } = generateDisputeNotificationTemplate(dispute.customId, DisputeNotifyStatus.EVENT_CHANGED, '', { newStatus: dispute.status });
                    notify.push({
                        recipientId: businessAccount.merchantId,
                        recipientType: 'MERCHANT',
                        businessId: businessAccount.id,
                        type: 'DISPUTE',
                        title: title2,
                        message: message2,
                        disputeId: dispute.id,
                        isRead: false,
                        channel: 'WEB'
                    });
                } else {

                    // Notify Merchant For Update Dispute Status With no Staff Assigned to it
                    const { title, message } = generateDisputeNotificationTemplate(dispute.customId, DisputeNotifyStatus.DISPUTE_RECEIVED_UNASSIGNED, '', {});
                    notify.push({
                        recipientId: businessAccount.merchantId,
                        recipientType: 'MERCHANT',
                        businessId: businessAccount.id,
                        type: 'DISPUTE',
                        title,
                        message,
                        disputeId: dispute.id,
                        isRead: false,
                        channel: 'WEB'
                    });
                }
            }
        }
        else {
            // Create a new Dispute 
            const disputePayload = {
                merchantId: businessAccount.merchantId,
                businessId: businessAccount?.id,
                customId,
                ...normalizePayload
            }
            dispute = await Dispute.create(disputePayload, { transaction: t });
            if (_.isEmpty(dispute)) {
                logPayload.log = "Dispute : Failed to Add New Received Dispute.";
                throw new AppError(statusCodes.BAD_REQUEST, 'Failed to Add Dispute');
            }

            logPayload.disputeId = dispute?.disputeId;
            logPayload.eventType = dispute?.event;
            logPayload.statusUpdatedAt = dispute?.statusUpdatedAt;
            logPayload.dueDate = dispute?.dueDate;
            logPayload.paymentId = dispute?.paymentId || normalizePayload?.paymentId;

            // for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(dispute))) {
            //     if (typeof dispute[key] === 'function' && key.includes('DisputeHistory')) {
            //         console.log(key);
            //     }
            // }
            //  Create Dispute History Record
            const [historyRecord,] = await Promise.all([

                // Add Dispute History Record
                dispute.createDisputeHistory({
                    merchantId: businessAccount.merchantId,
                    // disputeId: dispute?.id,
                    updatedStatus: dispute?.status,
                    updatedEvent: dispute?.event,
                    statusUpdateAt: dispute?.statusUpdatedAt,
                    payloadId: payload?.id
                }, {
                    transaction: t
                }),
                // Increase the dispute count in merchant
                Merchant.update(
                    { totalDisputes: sequelize.literal('total_disputes + 1') },
                    {
                        where: { id: businessAccount.merchantId },
                        transaction: t
                    }
                )
            ])
            // const historyRecord = await dispute.createDisputeHistory({
            //     merchantId: businessAccount.merchantId,
            //     // disputeId: dispute?.id,
            //     updatedStatus: dispute?.status,
            //     updatedEvent: dispute?.event,
            //     statusUpdateAt: dispute?.statusUpdatedAt,
            //     payloadId: payload?.id
            // }, {
            //     transaction: t
            // });

            // Update Merchant Total Disputes Count
            // await Merchant.update(
            //     { totalDisputes: sequelize.literal('total_disputes + 1') },
            //     {
            //         where: { id: businessAccount.merchantId },
            //         transaction: t
            //     }
            // );

            if (_.isEmpty(historyRecord)) {
                logPayload.log = `Dispute : Failed to Update ${dispute.customId} Status`;
                throw new AppError(statusCodes.BAD_REQUEST, 'Failed to Update Dispute History Status');
            }
            // Step 10 : If Merchant Staff Exist , Assign Dispute Using Round Robbin Algorithm For New Dispute


            if (!_.isEmpty(staffMembers)) {
                // Assign Dispute to Staff Using Round Robbin Algorithm

                // Round Robbin with race condition prevention 
                const analysts = staffMembers.sort((analyst1, analyst2) => new Date(analyst1?.createdAt) - new Date(analyst2?.createdAt));
                let ids = analysts?.map((staff) => staff?.id);;
                if (ids.length > 0) {
                    // Staff Assign Payload
                    const assignedPayload = {
                        ids,
                        merchantId: businessAccount.merchantId,
                        disputeId: dispute?.id,
                        staffState: staffAssignmentState,
                        t: t
                    }
                    // Assign Staff to Dispute in order of Round Robbin 
                    const nextStaffId = await AssignedDisputeToStaff(assignedPayload);
                    const nextStaff = staffMembers.find((staff) => staff?.id === nextStaffId);
                    const staffName = `${nextStaff?.firstName} ${nextStaff?.lastName}`;
                    dispute.analystId = nextStaffId;

                    // Generate Notification Template for Users
                    const { title, message } = generateDisputeNotificationTemplate(customId, DisputeNotifyStatus.ASSIGNED, staffName, {});
                    notify.push({
                        recipientId: nextStaffId,
                        recipientType: 'ANALYST',
                        businessId: businessAccount?.id,
                        type: 'DISPUTE',
                        title,
                        message,
                        disputeId: dispute.id,
                        isRead: false,
                        channel: 'WEB'
                    });

                    const { title: title2, message: message2 } = generateDisputeNotificationTemplate(dispute.customId, DisputeNotifyStatus.DISPUTE_RECEIVED_MERCHANT, staffName, {});
                    notify.push({
                        recipientId: businessAccount?.merchantId,
                        recipientType: 'MERCHANT',
                        businessId: businessAccount?.id,
                        type: 'DISPUTE',
                        title: title2,
                        message: message2,
                        disputeId: dispute.id,
                        isRead: false,
                        channel: 'WEB'
                    });
                }
            } else {
                // Notify Merchant about new dispute and no Staff Available to Assign Dispute
                const { title, message } = generateDisputeNotificationTemplate(dispute.customId, DisputeNotifyStatus.DISPUTE_RECEIVED_UNASSIGNED, '', {});
                notify.push({
                    recipientId: businessAccount?.merchantId,
                    recipientType: 'MERCHANT',
                    businessId: businessAccount?.id,
                    type: 'DISPUTE',
                    title,
                    message,
                    disputeId: dispute.id,
                    isRead: false,
                    channel: 'WEB'
                });
            }
        }


        // Step 11 : Notify Merchant or Staff for the status Update
        if (notify.length > 0) {
            await Notification.bulkCreate(notify, { transaction: t });
        }

        await t.commit(); // commit if everything passes
        const logMessage = isExist ? `Dispute: ${dispute.customId} status Updated` : `Dispute: New Dispute Added with id : ${dispute.customId}`;

        await DisputeLog.create({
            gateway: Gateway,
            merchantId: businessAccount?.merchantId,
            businessId: businessAccount.id,
            log: logMessage,
            disputeId: dispute.disputeId,
            paymentId: dispute.paymentId,
            status: 'success',
            statusUpdatedAt: dispute.statusUpdatedAt,
            dueDate: dispute.dueDate,
            eventType: dispute.event,
            ipAddress: clientIp,
            payloadId: payload.id,
        });
        // Step 12 : Return dispute
        console.log("Dispute Processed Successfully : Gateway : ", Gateway, " Dispute Id : ", dispute?.disputeId);
        return dispute;
    } catch (error) {
        console.log("Error in Webhook Processor : ", error?.message);
        await t.rollback();
        if (logPayload.merchantId) {
            await DisputeLog.create({
                ...logPayload,
                log: logPayload?.log + " | Error : " + error?.message,
                status: 'failed',
            });
        }
        throw new AppError(statusCodes.BAD_REQUEST, error?.message || 'Failed To Store Dispute Payload');
    }
}

export default ProcessWebhookPayload;