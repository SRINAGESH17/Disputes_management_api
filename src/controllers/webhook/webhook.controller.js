import _ from 'lodash';
import AppErrorCode from '../../constants/AppErrorCodes.js';
import statusCodes from '../../constants/httpStatusCodes.js';
import Merchant from '../../models/merchant.model.js';
import AppError from '../../utils/AppError.js';
import { DetectPaymentGateway, generateDisputeNotificationTemplate, OrchestratorGatewayParser } from './webhookHelpers.js';
import requestIP from "request-ip";
import Dispute from '../../models/dispute.model.js';
import { uniqueDisputeId } from '../../utils/generateIds.js';
import Staff from '../../models/staff.model.js';
import StaffAssignmentState from '../../models/staffAssignState.model.js';
import schemaValidator from '../../utils/schemaValidator.js';
import { normalizePayloadSchema } from '../../utils/yupSchema.js';
import sequelize from '../../config/database.js';
import DisputeLog from '../../models/disputeLog.model.js';
import Payload from '../../models/payload.model.js';
import DisputeStatus from '../../constants/disputeStatus.js';
import Notification from '../../models/notification.model.js';


const AssignedDisputeToStaff = async ({ ids, merchantId, disputeId, staffState, t }) => {
    try {
        const updates = [];
        console.time('RoundRobbin');
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
        console.timeEnd('RoundRobbin');
        updates.push(
            Dispute.update(
                { staffId: nextStaffId },
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
        console.time('updates');
        await Promise.all(updates);
        console.timeEnd('updates');

        return nextStaffId;
    }
    catch (error) {
        throw new AppError(statusCodes.BAD_REQUEST, error?.message);
    }
}

const receiveDisputesWebhook = async (req, res) => {

    const logPayload = {
        merchantId: 0,
        gateway: null,
        log: "",
        ipAddress: "",
        payloadId: null
    }

    const t = await sequelize.transaction(); // start a transaction

    // @desc : Receive Dispute From Payment Gateway and Store It And Notify Merchant or Staff
    try {

        // Step 1  : Extract the Gateway Data and MerchantId
        const { merchantId } = req.params;
        const rawPayload = req.body;
        const headers = req.headers;

        // Step 2  : Validate MerchantId is Valid or not

        // 2.1 : Check id must not Empty
        if (_.isEmpty(merchantId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('merchantId'));
        }

        // 2.2 : Check for valid id Format
        if (merchantId?.length !== 15 || merchantId.slice(0, 3) !== 'MID') {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('MerchantId'))
        }

        // Step 3  : IP Whitelisting of Gateway ----- Skip
        const clientIp = requestIP.getClientIp(req);

        //* Saving incoming payload for Record Update
        // const reqPayload = await Payload.create({
        //     merchantId: merchant.id,
        //     rawPayload: JSON.stringify({
        //         ipAddress: normalizePayload?.ipAddress,
        //         Gateway,
        //         ...req.body
        //     })
        // });
        // logPayload.payloadId = reqPayload?.id;

        // Step 4  : Detect Payment Gateway
        const Gateway = DetectPaymentGateway(headers, rawPayload);
        if (_.isEmpty(Gateway)) {
            throw new AppError(statusCodes.BAD_REQUEST, 'unknown detect');
        }

        // Step 5  : Parse the Gateway Payload      ==> Orchestrator Layer
        const parsePayload = OrchestratorGatewayParser(Gateway, rawPayload);

        if (_.isEmpty(parsePayload)) {
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
            disputeStatus: parsePayload?.status,
            event: parsePayload?.event,
            statusUpdatedAt: parsePayload?.statusUpdatedAt,
            dueDate: parsePayload?.dueDate,
            type: parsePayload?.type
        }

        // 6.2 : validate payload format
        if (await schemaValidator(normalizePayloadSchema, normalizePayload, res)) {
            throw new AppError(statusCodes.BAD_REQUEST, 'normalize payload validation failed');
        }

        // Step 7  : Check Merchant Exist or not
        console.time('merchantFetch');
        const merchant = await Merchant.findOne({ where: { merchantId }, attributes: ['id'], transaction: t, raw: true });
        if (_.isEmpty(merchant)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Merchant'));
        }

        console.timeEnd('merchantFetch');
        logPayload.merchantId = merchant.id;
        logPayload.gateway = Gateway;
        logPayload.ipAddress = clientIp;

        // Step 8  : Check For Duplicate Disputes
        if (_.isEmpty(normalizePayload?.disputeId)) {
            logPayload.log = 'Dispute : Failed to Get the Dispute from Gateway';
            throw new AppError(statusCodes.BAD_REQUEST, 'Failed to Get disputeId');
        }
        const mid = merchantId?.split('D')?.[1]?.slice(0, 2);

        console.time('disputeFetch');
        let [payloadData, dispute, customId, staffMembers, staffAssignmentState] = await Promise.all([

            // 1 . Create Payload Record
            Payload.create({
                merchantId: merchant.id,
                rawPayload: JSON.stringify({
                    ipAddress: normalizePayload?.ipAddress,
                    Gateway,
                    ...req.body
                })
            }, {
                transaction: t
            }),

            // 2 . Fetch the Dispute Exist Or Not
            Dispute.findOne({
                where: { disputeId: normalizePayload?.disputeId, merchantId: merchant.id },
                attributes: ['id', 'staffId', 'customId', 'ipAddress', 'disputeStatus', 'event', 'statusUpdatedAt', 'dueDate', 'type', 'status'],
                transaction: t
            }),

            // 3 . Generate Unique id for Dispute
            uniqueDisputeId(mid, t),

            // 4. Fetch Merchant Staff
            Staff.findAll({
                where: { merchantId: merchant?.id },
                attributes: ['id', 'firstName', 'lastName'],
                transaction: t,
                raw: true,
            }),

            // 5. Fetch the State of Staff To Get the Next Staff index to Assign Dispute
            StaffAssignmentState.findOne({
                where: { merchantId: merchant?.id },
                attributes: ['id', 'lastStaffAssigned'],
                lock: t.LOCK.UPDATE,  // use lock WITHIN parent transaction
                transaction: t,
                raw: true
            })
        ]);
        console.timeEnd("disputeFetch");
        logPayload.payloadId = payloadData?.id;
        const isExist = !!dispute;

        // Step 9  : Store or Update Dispute history Record
        const notify = [];
        if (isExist) {

            // Update the dispute history
            dispute.ipAddress = normalizePayload?.ipAddress;
            dispute.disputeStatus = normalizePayload?.disputeStatus;
            dispute.event = normalizePayload?.event;
            dispute.statusUpdatedAt = normalizePayload?.statusUpdatedAt;
            dispute.dueDate = normalizePayload?.dueDate;
            dispute.type = normalizePayload?.type;
            dispute.status = 'UPDATED';
            console.time("UpdateDisputeAndRecord");
            const [disputeData, historyRecord] = await Promise.all([
                // 1. Save Updated Dispute
                dispute.save({ transaction: t }),

                // 2. Create History record for Dispute
                dispute.createDisputeHistory({
                    merchantId: merchant?.id,
                    disputeId: dispute?.id,
                    updatedStatus: normalizePayload?.disputeStatus,
                    updatedEvent: normalizePayload?.event,
                    statusUpdateAt: normalizePayload?.statusUpdatedAt,
                    payloadId: payloadData?.id
                }, {
                    transaction: t
                })
            ]);
            console.timeEnd("UpdateDisputeAndRecord");
            dispute = disputeData;

            // Validate Record is Created or Not
            if (_.isEmpty(historyRecord)) {
                logPayload.log = `Dispute : Failed to Update ${dispute.customId} Status`;
                throw new AppError(statusCodes.BAD_REQUEST, 'Failed to Update Dispute History Status');
            }

            if (!_.isEmpty(staffMembers) && !dispute?.staffId) {
                // Assign Dispute to Staff Using Round Robbin Algorithm

                // Round Robbin with race condition prevention 
                let ids = staffMembers?.map((staff) => staff?.id);
                ids.sort((a, b) => a - b);
                if (ids.length > 0) {

                    // Payload to Assigned Staff
                    const assignedPayload = {
                        ids,
                        merchantId: merchant?.id,
                        disputeId: dispute?.id,
                        staffState: staffAssignmentState,
                        t: t
                    }

                    // Service to Assign Staff In Order using Round Robbin Algorithm
                    const nextStaffId = await AssignedDisputeToStaff(assignedPayload);

                    const nextStaff = staffMembers.find((staff) => staff?.id === nextStaffId);
                    const staffName = `${nextStaff?.firstName} ${nextStaff?.lastName}`;
                    dispute.staffId = nextStaffId;

                    // Generate Notification Templates For Users
                    const { title, message } = generateDisputeNotificationTemplate(customId, DisputeStatus.ASSIGNED, staffName, {});
                    notify.push({
                        recipientId: nextStaffId,
                        recipientType: 'STAFF',
                        type: 'DISPUTE',
                        title,
                        message,
                        disputeId: dispute.id,
                        isRead: false,
                        channel: 'WEB'
                    });

                    const { title: title2, message: message2 } = generateDisputeNotificationTemplate(dispute.customId, DisputeStatus.EVENT_CHANGED_ASSIGNED_STAFF, staffName, { newStatus: dispute.event });
                    notify.push({
                        recipientId: merchant?.id,
                        recipientType: 'MERCHANT',
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
                if (dispute?.staffId) {
                    const { title, message } = generateDisputeNotificationTemplate(dispute.customId, DisputeStatus.EVENT_CHANGED, '', { newStatus: dispute.event });
                    notify.push({
                        recipientId: dispute?.staffId,
                        recipientType: 'STAFF',
                        type: 'DISPUTE',
                        title,
                        message,
                        disputeId: dispute.id,
                        isRead: false,
                        channel: 'WEB'
                    });
                    const { title: title2, message: message2 } = generateDisputeNotificationTemplate(dispute.customId, DisputeStatus.EVENT_CHANGED, '', { newStatus: dispute.event });
                    notify.push({
                        recipientId: merchant?.id,
                        recipientType: 'MERCHANT',
                        type: 'DISPUTE',
                        title: title2,
                        message: message2,
                        disputeId: dispute.id,
                        isRead: false,
                        channel: 'WEB'
                    });
                } else {

                    // Notify Merchant For Update Dispute Status With no Staff Assigned to it
                    const { title, message } = generateDisputeNotificationTemplate(dispute.customId, DisputeStatus.DISPUTE_RECEIVED_UNASSIGNED, '', {});
                    notify.push({
                        recipientId: merchant?.id,
                        recipientType: 'MERCHANT',
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
                merchantId: merchant.id,
                customId,
                ...normalizePayload
            }
            console.time('disputeCreation')
            dispute = await Dispute.create(disputePayload, { transaction: t });
            console.timeEnd('disputeCreation')
            if (_.isEmpty(dispute)) {
                logPayload.log = "Dispute : Failed to Add New Received Dispute.";
                throw new AppError(statusCodes.BAD_REQUEST, 'Failed to Add Dispute');
            }

            //  Create Dispute History Record
            const historyRecord = await dispute.createDisputeHistory({
                merchantId: merchant.id,
                disputeId: dispute?.id,
                updatedStatus: dispute?.disputeStatus,
                updatedEvent: dispute?.event,
                statusUpdateAt: dispute?.statusUpdatedAt,
                payloadId: payloadData?.id
            }, {
                transaction: t
            })


            if (_.isEmpty(historyRecord)) {
                logPayload.log = `Dispute : Failed to Update ${dispute.customId} Status`;
                throw new AppError(statusCodes.BAD_REQUEST, 'Failed to Update Dispute History Status');
            }
            // Step 10 : If Merchant Staff Exist , Assign Dispute Using Round Robbin Algorithm For New Dispute


            if (!_.isEmpty(staffMembers)) {
                // Assign Dispute to Staff Using Round Robbin Algorithm

                // Round Robbin with race condition prevention 
                let ids = staffMembers?.map((staff) => staff?.id);
                ids.sort((a, b) => a - b);
                if (ids.length > 0) {
                    // Staff Assign Payload
                    const assignedPayload = {
                        ids,
                        merchantId: merchant?.id,
                        disputeId: dispute?.id,
                        staffState: staffAssignmentState,
                        t: t
                    }
                    // Assign Staff to Dispute in order of Round Robbin 
                    const nextStaffId = await AssignedDisputeToStaff(assignedPayload);
                    const nextStaff = staffMembers.find((staff) => staff?.id === nextStaffId);
                    const staffName = `${nextStaff?.firstName} ${nextStaff?.lastName}`;
                    dispute.staffId = nextStaffId;

                    // Generate Notification Template for Users
                    const { title, message } = generateDisputeNotificationTemplate(customId, DisputeStatus.ASSIGNED, staffName, {});
                    notify.push({
                        recipientId: nextStaffId,
                        recipientType: 'STAFF',
                        type: 'DISPUTE',
                        title,
                        message,
                        disputeId: dispute.id,
                        isRead: false,
                        channel: 'WEB'
                    });

                    const { title: title2, message: message2 } = generateDisputeNotificationTemplate(dispute.customId, DisputeStatus.DISPUTE_RECEIVED_MERCHANT, staffName, {});
                    notify.push({
                        recipientId: merchant?.id,
                        recipientType: 'MERCHANT',
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
                const { title, message } = generateDisputeNotificationTemplate(dispute.customId, DisputeStatus.DISPUTE_RECEIVED_UNASSIGNED, '', {});
                notify.push({
                    recipientId: merchant?.id,
                    recipientType: 'MERCHANT',
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
        const logMessage = isExist ? `${dispute.customId} status Updated` : `New Dispute Added with id -> ${dispute.customId}`;

        console.time('logCreate')
        await DisputeLog.create({
            gateway: Gateway,
            merchantId: merchant.id,
            log: `Dispute: ` + logMessage,
            ipAddress: clientIp,
            payloadId: payloadData?.id
        });
        console.timeEnd('logCreate')
        // Step 12 : Return OK to Gateway
        return res.status(statusCodes.OK).json({
            dispute
        });
    } catch (error) {
        await t.rollback();
        if (logPayload.merchantId) {
            await DisputeLog.create({
                ...logPayload,
                log: logPayload?.log + " , Error : " + error?.message,
                // payload: req.body
            });
        }
        return res.status(statusCodes.BAD_REQUEST).json({ message: error?.message || 'Failed to receive Dispute From Gateway' });
    }
}

export default receiveDisputesWebhook;