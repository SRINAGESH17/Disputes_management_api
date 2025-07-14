import _ from "lodash";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import statusCodes from "../../constants/status-codes.constant.js";
import Dispute from "../../models/dispute.model.js";
import AppError from "../../utils/app-error.util.js";
import catchAsync from "../../utils/catch-async.util.js";
import helpers from "../../utils/helpers.util.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import DisputeHistory from "../../models/dispute-history.model.js";



// Fetch Dispute Overview
const fetchDisputeOverview = catchAsync(async (req, res) => {

    try {
        // Step 1 : Extract the dispute Id from request params
        const { disputeId } = req.params;

        // Step 2 : Validate the Dispute Id
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }

        // Step 3 : Call the dispute model
        let dispute = await Dispute.findOne({ where: { customId: disputeId }, attributes: ['id', 'customId', 'gateway', 'status', 'state', 'statusUpdatedAt', 'dueDate', 'amount', 'workflowStage'], raw: true });

        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Dispute'));
        }

        dispute = {
            id: dispute?.id,
            disputeId: dispute?.customId,
            status: dispute?.state,
            chargeBackDate: dispute?.statusUpdatedAt,
            gateway: dispute?.gateway,
            amount: dispute?.amount,
            respondBy: dispute?.dueDate,
            currentStage: dispute?.workflowStage,
        }
        // Step 4 : refactor or return the payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Dispute Overview Fetch Successfully',
                {
                    dispute
                },
                false
            )
        )
    } catch (error) {
        console.log("Error in Fetch dispute Overview Controller: ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed To Fetch Dispute Overview',
                {
                    message: error?.message,
                },
                false
            )
        )
    }

});

// Fetch Dispute Details
const fetchDisputeDetails = catchAsync(async (req, res) => {

    try {
        // Step 1 : Extract the dispute Id from request params
        const { disputeId } = req.params;

        // Step 2 : Validate the Dispute Id
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }

        // Step 3 : Call the dispute model
        let dispute = await Dispute.findOne({
            where: { customId: disputeId },
            attributes: ['id', 'customId', 'gateway', 'status', 'paymentId', 'state', 'reason', 'type', 'statusUpdatedAt', 'dueDate', 'amount', 'workflowStage', 'explanation', 'notes', 'contest_reason', 'createdAt'],
            raw: true
        });

        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Dispute'));
        }

        dispute = {
            id: dispute?.id,
            disputeId: dispute?.customId,
            transactionId: dispute?.paymentId,
            status: dispute?.state,
            reason: dispute?.reason,
            type: dispute?.type,
            statusUpdatedAt: dispute?.statusUpdatedAt,
            respondBy: dispute?.dueDate,
            gateway: dispute?.gateway,
            amount: dispute?.amount,
            currency: dispute?.currency,
            currentStage: dispute?.workflowStage,
            explanation: dispute?.explanation || "",
            notes: dispute?.notes || "",
            contestReason: dispute?.contest_reason || ""
        }
        // Step 4 : refactor or return the payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Dispute Details Fetch Successfully',
                {
                    dispute
                },
                false
            )
        )
    } catch (error) {
        console.log("Error in Fetch dispute Details Controller: ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed To Fetch Dispute Details',
                {
                    message: error?.message,
                },
                false
            )
        )
    }

});

// Fetch Dispute Transaction
const fetchDisputeTransaction = catchAsync(async (req, res) => {

    try {
        // Step 1 : Extract the dispute Id from request params
        const { disputeId } = req.params;

        // Step 2 : Validate the Dispute Id
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }

        // Step 3 : Call the dispute model
        let dispute = await Dispute.findOne({
            where: { customId: disputeId },
            attributes: ['id', 'customId', 'gateway', 'disputeId', 'paymentId', 'amount', 'statusUpdatedAt', 'dueDate', 'createdAt', 'workflowStage'],
            raw: true
        });

        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Dispute'));
        }
        // Formatted The Payload
        dispute = {
            id: dispute?.id,
            disputeId: dispute?.customId,
            transactionId: dispute?.paymentId,
            gatewayDisputeId: dispute?.disputeId,
            statusUpdatedAt: dispute?.statusUpdatedAt,
            respondBy: dispute?.dueDate,
            gateway: dispute?.gateway,
            amount: dispute?.amount,
            currentStage: dispute?.workflowStage,
            createdAt: dispute?.createdAt,
        }
        console.log("details : ", dispute)

        // Fetch Time Line
        let disputeTimeLine = await DisputeHistory.findAll({
            where: { disputeId: dispute?.id },
            attributes: ['id', 'updatedStatus', 'updatedEvent', 'statusUpdateAt'],
            order: [['createdAt', 'ASC']],
            raw: true
        });

        // Formatted The Payload
        disputeTimeLine = disputeTimeLine.map((record) => {
            return {
                id: record?.id,
                gatewayDisputeStatus: record?.updatedStatus?.split('_')?.map((word) => word[0]?.toUpperCase() + word?.slice(1)).join(" "),
                gatewayEvent: record?.updatedEvent?.split('_')?.map((word) => word[0]?.toUpperCase() + word?.slice(1)).join(" "),
                statusUpdatedAt: record?.statusUpdateAt,
            }
        })

        // Step 4 : refactor or return the payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Dispute Time line Fetch Successfully',
                {
                    dispute,
                    timeLine: disputeTimeLine
                },
                false
            )
        )
    } catch (error) {
        console.log("Error in Fetch dispute Transaction Controller: ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed To Fetch Dispute Transaction',
                {
                    message: error?.message,
                },
                false
            )
        )
    }

});


const disputeController = {
    fetchDisputeOverview,
    fetchDisputeDetails,
    fetchDisputeTransaction
};


export default disputeController;