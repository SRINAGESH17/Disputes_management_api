import _ from "lodash";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import statusCodes from "../../constants/status-codes.constant.js";
import Dispute from "../../models/dispute.model.js";
import AppError from "../../utils/app-error.util.js";
import catchAsync from "../../utils/catch-async.util.js"
import helpers from "../../utils/helpers.util.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import { Op } from "sequelize";
import { GatewayNames } from "../../constants/gateways.constant.js";


// Fetch Analyst Assigned Disputes with filters
const analystAssignedDisputes = catchAsync(async (req, res) => {
    // @route : /api/v2/analyst/disputes/assigned
    // @desc  : Fetch the disputes which are assigned to Analyst
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { disputeId, gateway, fromDate, toDate } = req.query;

        // Step 1 : Extract the BusinessId from request params
        const businessId = req.businessId;

        // Step 2 : Validate Business is Valid UUID
        // If No Business Id Assigned then Return 
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    'Assigned Disputes Fetch Successfully',
                    {
                        totalPages: 0,
                        totalDisputes: 0,
                        page: 0,
                        limit: 10,
                        disputes: []
                    },
                    false
                )
            );
        }

        // Validate Gateway
        if (gateway && !GatewayNames?.includes(gateway?.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldValue('gateway'));
        }

        // Check BusinessId is Valid UUIDV4
        if (!helpers.isValidUUIDv4(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('BusinessId'));
        }

        // Check AnalystId is Valid UUIDV4
        if (!helpers.isValidUUIDv4(req?.userRole?.userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('AnalystId'));
        }

        // Generate Filters Payload for fetching disputes
        const filters = {
            businessId,
            analystId: req?.userRole?.userId,
        };

        // add Dispute Id filter
        if (disputeId) {
            filters[Op.or] = [
                // { disputeId: { [Op.iLike]: `%${disputeId}%` } },
                { customId: { [Op.iLike]: `%${disputeId}%` } },
            ];
        }

        // Add Gateway Filter
        if (gateway) {
            filters[Op.or] = [
                ...(filters[Op.or] || []),
                { gateway: { [Op.iLike]: `%${gateway}%` } },
            ];
        }

        // Validate Date filters 
        if (fromDate && isNaN(Date.parse(fromDate))) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("fromDate", 'Date String'));

        }
        if (toDate && isNaN(Date.parse(toDate))) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("toDate", 'Date String'));
        }

        // add dates in filter
        if (fromDate || toDate) {
            filters.createdAt = {};
            if (fromDate) {
                filters.createdAt[Op.gte] = new Date(fromDate);
            }
            if (toDate) {
                filters.createdAt[Op.lte] = new Date(toDate);
            }
        }

        // Step 3 : Fetch the Disputes Of the Business

        let [disputes, totalDisputes] = await Promise.all([
            // 1. Fetch Analyst Assigned Disputes
            // Fetch Disputes with filters
            Dispute.findAll({
                where: filters,
                attributes: {
                    include: ['id', 'customId', 'paymentId', 'amount', 'gateway', 'statusUpdatedAt', 'reason', 'dueDate', 'state', 'workflowStage', 'createdAt', 'updatedAt']
                },
                order: [['updatedAt', 'DESC']],
                limit,
                offset: skip,
                raw: true
            }),

            // Fetch the Total Number of Disputes
            Dispute.count({ where: filters }),
        ]);

        const totalPages = Math.ceil(totalDisputes / limit);
        disputes = disputes?.map((dispute) => {
            return {
                disputeId: dispute?.customId,
                paymentId: dispute?.paymentId,
                amount: dispute?.amount,
                gateway: dispute?.gateway,
                statusUpdatedAt: dispute?.statusUpdatedAt,
                reason: dispute?.reason,
                createdAt: dispute?.createdAt,
                respondBy: dispute?.dueDate,
                disputeStatus: dispute?.state,
                status: dispute?.workflowStage
            }
        })

        // Step 4 : refactor or return the payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Assigned Disputes Fetched Successfully',
                {
                    totalDisputes,
                    totalPages,
                    page,
                    limit,
                    disputes
                },
                true
            )
        )
    } catch (error) {
        console.log("Error in Fetch assigned dispute Controller: ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed To Fetch Assigned Dispute',
                {
                    message: error?.message,
                },
                false
            )
        )
    }
});

// Fetch Analyst Submitted, Accepted and Rejected Disputes with filters
const analystProcessedDisputes = catchAsync(async (req, res) => {
    // @route : /api/v2/analyst/disputes/process/:status
    // @desc  : Fetch the disputes which are Processed by the specific Analyst
    try {
        const { status } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { disputeId, gateway, fromDate, toDate } = req.query;

        // Step 1 : Extract the BusinessId from request params
        const businessId = req.businessId;

        // Step 2 : Validate Business is Valid UUID
        // If No Business Id Assigned then Return 
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    'Assigned Disputes Fetch Successfully',
                    {
                        totalPages: 0,
                        totalDisputes: 0,
                        page: 0,
                        limit: 10,
                        disputes: []
                    },
                    false
                )
            );
        }

        // 2.1 : Validate Gateway
        if (gateway && !GatewayNames?.includes(gateway?.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldValue('gateway'));
        }

        // 2.2 : Check BusinessId is Valid UUIDV4
        if (!helpers.isValidUUIDv4(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('BusinessId'));
        }

        // 2.3 : Check AnalystId is Valid UUIDV4
        if (!helpers.isValidUUIDv4(req?.userRole?.userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('AnalystId'));
        }

        // 2.4 : Validate the process status is valid or not
        if (_.isEmpty(status)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('status'));
        }

        if (!['submitted', 'accepted', 'rejected', 'resubmitted'].includes(status?.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldIsRequired('status'));
        }

        // Generate Filters Payload for fetching disputes
        const filters = {
            businessId,
            analystId: req?.userRole?.userId,
            workflowStage: status?.toUpperCase(),
        };

        // add Dispute Id filter
        if (disputeId) {
            filters[Op.or] = [
                // { disputeId: { [Op.iLike]: `%${disputeId}%` } },
                { customId: { [Op.iLike]: `%${disputeId}%` } },
            ];
        }

        // Add Gateway Filter
        if (gateway) {
            filters[Op.or] = [
                ...(filters[Op.or] || []),
                { gateway: { [Op.iLike]: `%${gateway}%` } },
            ];
        }

        // Validate Date filters 
        if (fromDate && isNaN(Date.parse(fromDate))) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("fromDate", 'Date String'));

        }
        if (toDate && isNaN(Date.parse(toDate))) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("toDate", 'Date String'));
        }

        // add dates in filter
        if (fromDate || toDate) {
            filters.createdAt = {};
            if (fromDate) {
                filters.createdAt[Op.gte] = new Date(fromDate);
            }
            if (toDate) {
                filters.createdAt[Op.lte] = new Date(toDate);
            }
        }

        // Step 3 : Fetch the Disputes Of the Business

        let [disputes, totalDisputes] = await Promise.all([
            // 1. Fetch Analyst Assigned Disputes
            // Fetch Disputes with filters
            Dispute.findAll({
                where: filters,
                attributes: {
                    include: ['id', 'customId', 'paymentId', 'amount', 'gateway', 'statusUpdatedAt', 'reason', 'dueDate', 'state', 'feedback', 'lastStage', 'lastStageAt', 'updatedStageAt', 'updatedStage', 'workflowStage', 'createdAt', 'updatedAt']
                },
                order: [['updatedAt', 'DESC']],
                limit,
                offset: skip,
                raw: true
            }),

            // Fetch the Total Number of Disputes
            Dispute.count({ where: filters }),
        ]);

        const totalPages = Math.ceil(totalDisputes / limit);
        disputes = disputes?.map((dispute) => {
            return {
                id: dispute?.id,
                disputeId: dispute?.customId,
                paymentId: dispute?.paymentId,
                amount: dispute?.amount,
                gateway: dispute?.gateway,
                statusUpdatedAt: dispute?.statusUpdatedAt,
                reason: dispute?.reason,
                createdAt: dispute?.createdAt,
                respondBy: dispute?.dueDate,
                disputeStatus: dispute?.state,
                feedback: dispute?.feedback,

                lastStage: dispute?.lastStage,
                lastStageAt: dispute?.lastStageAt,
                updatedStage: dispute?.updatedStage,
                updatedStageAt: dispute?.updatedStageAt,
                currentStage: dispute?.workflowStage
            }
        })

        // Step 4 : refactor or return the payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Disputes Fetched Successfully',
                {
                    totalDisputes,
                    totalPages,
                    page,
                    limit,
                    disputes
                },
                true
            )
        )
    } catch (error) {
        console.log("Error in Fetch disputes Controller: ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed To Fetch Disputes',
                {
                    message: error?.message,
                },
                false
            )
        )
    }
});


const analystDisputeWorkflowController = {
    analystAssignedDisputes,
    analystProcessedDisputes
};

export default analystDisputeWorkflowController;