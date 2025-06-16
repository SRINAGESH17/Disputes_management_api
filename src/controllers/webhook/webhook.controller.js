import _ from 'lodash';
import AppErrorCode from '../../constants/AppErrorCodes.js';
import statusCodes from '../../constants/httpStatusCodes.js';
import Merchant from '../../models/merchant.model.js';
import AppError from '../../utils/AppError.js';
import { DetectPaymentGateway, OrchestratorGatewayParser } from './webhookHelpers.js';
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


const receiveDisputesWebhook = async (req, res) => {

    const logPayload = {
        merchantId: 0,
        gateway: null,
        log: "",
        ipAddress: "",
        payloadId: null
    }

    // const t = await sequelize.transaction(); // start a transaction

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
        const merchant = await Merchant.findOne({ where: { merchantId }, attributes: ['id'], raw: true });
        if (_.isEmpty(merchant)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Merchant'));
        }
        // console.log("merchant: ", merchant);
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
        let [payloadData, dispute, customId] = await Promise.all([

            // 1 . Create Payload Record
            Payload.create({
                merchantId: merchant.id,
                rawPayload: JSON.stringify({
                    ipAddress: normalizePayload?.ipAddress,
                    Gateway,
                    ...req.body
                })
            }),

            // 2 . Fetch the Dispute Exist Or Not
            Dispute.findOne({
                where: { disputeId: normalizePayload?.disputeId, merchantId: merchant.id },
                attributes: ['id', 'customId', 'ipAddress', 'disputeStatus', 'event', 'statusUpdatedAt', 'dueDate', 'type', 'status'],
            }),

            // 3 . Generate Unique id for Dispute
            uniqueDisputeId(mid),
        ]);
        console.timeEnd("disputeFetch");
        logPayload.payloadId = payloadData?.id;
        const isExist = !!dispute;

        // Step 9  : Store or Update Dispute history
        if (isExist) {
            console.log("If Exist : ")
            // Update the dispute history
            dispute.ipAddress = normalizePayload?.ipAddress;
            dispute.disputeStatus = normalizePayload?.disputeStatus;
            dispute.event = normalizePayload?.event;
            dispute.statusUpdatedAt = normalizePayload?.statusUpdatedAt;
            dispute.dueDate = normalizePayload?.dueDate;
            dispute.type = normalizePayload?.type;
            dispute.status = 'UPDATED';
            const [disputeData, historyRecord] = await Promise.all([
                // 1. Save Updated Dispute
                dispute.save(),

                // 2. Create History record for Dispute
                dispute.createDisputeHistory({
                    merchantId: merchant?.id,
                    disputeId: dispute?.id,
                    updatedStatus: normalizePayload?.disputeStatus,
                    updatedEvent: normalizePayload?.event,
                    statusUpdateAt: normalizePayload?.statusUpdatedAt,
                    payloadId: payloadData?.id
                })
            ])
            dispute = disputeData;
            if (_.isEmpty(historyRecord)) {
                logPayload.log = `Dispute : Failed to Update ${dispute.customId} Status`;
                throw new AppError(statusCodes.BAD_REQUEST, 'Failed to Update Dispute History Status');
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
            dispute = await Dispute.create(disputePayload);
            console.timeEnd('disputeCreation')
            if (_.isEmpty(dispute)) {
                logPayload.log = "Dispute : Failed to Add New Received Dispute.";
                throw new AppError(statusCodes.BAD_REQUEST, 'Failed to Add Dispute');
            }

            const [historyRecord, staffMembers, staffAssignmentState] = await Promise.all([

                // 1. Create Dispute History Record
                dispute.createDisputeHistory({
                    merchantId: merchant.id,
                    disputeId: dispute?.id,
                    updatedStatus: dispute?.disputeStatus,
                    updatedEvent: dispute?.event,
                    statusUpdateAt: dispute?.statusUpdatedAt,
                    payloadId: payloadData?.id
                }),

                // 2. Fetch Merchant Staff
                Staff.findAll({
                    where: { merchantId: merchant?.id },
                    attributes: ['id'],
                    raw: true,
                }),

                // 3.. Fetch the State of Staff To Get the Next Staff index to Assign Dispute
                StaffAssignmentState.findOne({
                    where: { merchantId: merchant?.id },
                    attributes: ['id', 'lastStaffAssigned'],

                    // lock: t.LOCK.UPDATE,  // use lock WITHIN parent transaction
                    // transaction: t,
                    raw: true
                })
            ]);

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
                    const updates = [];
                    console.time('RoundRobbin')
                    let state = staffAssignmentState;
                    let nextStaffId;
                    let isFirst = false;
                    if (!state) {
                        const firstStaffId = ids[0];
                        updates.push(
                            StaffAssignmentState.create({
                                merchantId,
                                lastStaffAssigned: firstStaffId
                            })
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
                    dispute.staffId = nextStaffId;
                    console.time('dispute.save');
                    updates.push(
                        Dispute.update(
                            { staffId: dispute?.staffId },
                            {
                                where: { id: dispute?.id }
                            }

                        )
                    );
                    console.timeEnd('dispute.save');

                    console.time('state.save');
                    if (!isFirst) {
                        updates.push(
                            StaffAssignmentState.update(
                                { lastStaffAssigned: nextStaffId },
                                {
                                    where: { merchantId: merchant.id }
                                }
                            )
                        );
                    }
                    console.timeEnd('state.save');
                    console.time('updates');
                    await Promise.all(updates);
                    console.timeEnd('updates');
                }
            }
        }


        // Step 11 : Notify Merchant or Staff for the status Update


        // Step 12 : Return OK to Gateway
        // await t.commit(); // commit if everything passes
        const message = isExist ? `${dispute.customId} status Updated` : `New Dispute Added with id -> ${dispute.customId}`;

        console.time('logCreate')
        await DisputeLog.create({
            gateway: Gateway,
            merchantId: merchant.id,
            log: `Dispute: ` + message,
            ipAddress: clientIp,
            payloadId: payloadData?.id
        });
        console.timeEnd('logCreate')
        return res.status(statusCodes.OK).json({
            dispute
        });
    } catch (error) {
        // await t.rollback();
        if (logPayload.merchantId) {
            await DisputeLog.create({
                ...logPayload,
                log: logPayload?.log + " , Error : " + error?.message,
                payload: req.body
            });
        }
        return res.status(statusCodes.BAD_REQUEST).json({ message: error?.message || 'Failed to receive Dispute From Gateway' });
    }
}

export default receiveDisputesWebhook;