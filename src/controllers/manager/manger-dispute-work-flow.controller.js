import _ from 'lodash';
import { Op } from 'sequelize';
import Dispute from '../../models/dispute.model.js';
import catchAsync from '../../utils/catch-async.util.js';
import AppError from '../../utils/app-error.util.js';
import AppErrorCode from '../../constants/app-error-codes.constant.js';
import statusCodes from '../../constants/status-codes.constant.js';
import { success_response, failed_response } from '../../utils/response.util.js';
import Analyst from '../../models/analyst.model.js';
import { GatewayNames } from '../../constants/gateways.constant.js';


const isValidDate = (dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}


/**
 * @function getSubmittedDisputes
 * @description Fetches the list of disputes assigned to the manager that are in the "SUBMITTED" workflow stage.
 *
 * @route GET /api/v2/manager/disputes/assigned
 *
 * @param {Object} req - Express request object
 * @param {Object} req.currUser - The currently authenticated user object
 * @param {Object} req.userRole - The roles associated with the current user
 * @param {string} req.businessId - The business ID associated with the request
 * @param {Object} req.query - Query parameters for filtering and pagination
 * @param {string} [req.query.fromDate] - Optional filter for disputes updated after this date
 * @param {string} [req.query.toDate] - Optional filter for disputes updated before this date
 * @param {string} [req.query.gateway] - Optional filter for payment gateway
 * @param {string} [req.query.search] - Optional search string for custom dispute ID
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=10] - Number of records per page (max 25)
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Success response with paginated list of assigned disputes
 * @returns {Object} 400 - Bad request if user is not authorized or invalid parameters
 * @returns {Object} 500 - Internal server error if fetching fails
 *
 * @throws {AppError} If the current user, user role, or business ID is invalid, or if query parameters are invalid
 *
 * Steps:
 * 1. Extracts and validates the current user, user role, and business ID.
 * 2. Validates and applies filters for date range, gateway, and search.
 * 3. Constructs a query to fetch submitted disputes assigned to the manager.
 * 4. Returns a paginated list of disputes or an empty list if business ID is missing.
 */

// @desc Fetching the Assigned Disputes of Manager
const getSubmittedDisputes = catchAsync(async (req, res) => {
    // @route  : GET /api/v2/manager/disputes/assigned

    try {

        // Step 1 : Extracting the CurrUser , userRole and BusinessId from the request 
        const { currUser, userRole, businessId } = req;

        // Step 2 : Initializing the Variables for the pagination 
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 25);
        const offset = parseInt((page - 1) * limit);

        // Step 3 : Checking any Search  from the Query Params
        const { fromDate, toDate, gateway, search } = req.query;


        // Step 4 : validating the Manager and UserId 
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        };

        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("userId"));
        }

        if (!userRole.manager) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized)
        }

        // Step 5 : Validating the BusinessId
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(success_response(
                statusCodes.OK,
                "Successfully Fetched Assigned Disputes",
                {
                    totalPages: 0,
                    totalDisputes: 0,
                    page: 0,
                    limit: 10,
                    disputes: [],
                },
                false
            ))
        }


        // Step 6 : Validating the FromDate and To date Format 
        if (fromDate && !isValidDate(fromDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date!"));
        }

        if (toDate && !isValidDate(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date!"));
        }

        if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("From Date", "To Date"));
        }

        // Step 7 : validating the gateway 
        if (gateway) {
            if (!GatewayNames.includes(gateway.toLowerCase())) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField("Gateway"));
            }
        }


        // Step 8 : Creating Objects to Find the Disputes which are Submitted Disputes 
        const whereClause = {
            businessId: businessId,
            workflowStage: "SUBMITTED",
        }


        // Step 9 : Applying Search Filter for custom dispute Id ,Date and Gateway
        if (fromDate && toDate) {
            whereClause.updatedStageAt = {
                [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
            };
        } else if (fromDate) {
            whereClause.updatedStageAt = {
                [Op.gte]: new Date(fromDate)
            };
        } else if (toDate) {
            whereClause.updatedStageAt = {
                [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
            };
        }

        if (gateway) {
            whereClause[Op.or] = [
                ...(whereClause[Op.or] || []),
                { gateway: { [Op.iLike]: `%${gateway}%` } },
            ];
        }

        if (search) {
            whereClause.customId = {
                [Op.iLike]: `%${search}%`
            };

        }


        // Step 10 : Fetching the Dispute that are submitted by the Staff and total Disputes Count 
        const { count: totalDisputes, rows: SubmittedDisputes } = await Dispute.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'disputeId', 'customId', 'analystId', 'paymentId', 'gateway', 'updatedStageAt', 'lastStageAt', 'reason', 'dueDate', 'state', 'workflowStage', 'createdAt', 'feedback', 'updatedAt'],
            limit: limit,
            offset: offset,
            order: [['dueDate', 'ASC']],
            raw: true,
        })

        // Step 11 : Creating a Custom Payload to Send in the response in Detail 
        const analystDetails = [];
        const disputeAnalysts = SubmittedDisputes.map((dispute) => dispute.analystId);

        const uniqueAnalysts = new Set(disputeAnalysts);


        const analysts = await Analyst.findAll({ where: { id: { [Op.in]: Array.from(uniqueAnalysts) } }, attributes: ["id", "firstName", "lastName"], raw: true })



        analysts.forEach((analyst) => {
            const analystObj = {}
            if (uniqueAnalysts.has(analyst.id)) {
                analystObj.analystId = analyst.id;
                analystObj.analystName = `${analyst.firstName} ${analyst.lastName}`;
                analystDetails.push(analystObj)
            }
        })

        console.log(analystDetails);

        const disputes = SubmittedDisputes.map((dispute) => {
            const disputeStaff = dispute?.analystId ? analystDetails?.find((analyst) => analyst?.analystId === dispute?.analystId) : null;
            const staffName = disputeStaff ? `${disputeStaff?.analystName}` : '';
            return {
                disputeId: dispute?.customId,
                paymentId: dispute?.paymentId,
                analystId: dispute?.analystId,
                staffName,
                amount: dispute?.amount,
                ChargeBackDate: dispute?.createdAt,
                reason: dispute?.reason,
                respondBy: dispute?.dueDate,
                state: dispute?.state,
                gateway: dispute?.gateway,
                type: dispute?.type,
                updatedAt: dispute?.updatedAt,
                currentStage: dispute?.workflowStage
            }
        })

        const totalPages = Math.ceil(totalDisputes / limit);

        const payload = {
            totalDisputes,
            totalPages,
            page,
            limit,
            disputes
        }


        // Step 12 : returning  the Fetched Dispute Response with the Pagination terms and total Count 
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetched Assigned Disputes",
                {
                    payload
                },
                true
            )
        );

    } catch (error) {
        console.log("Error in Fetching the Assigned Dispute  Details!: ", error?.message);
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Failed Fetching Assigned Dispute Data",
                { message: error?.message || "Fetching of Assigned Disputes Failed" },
                false
            )
        )
    }
});


/**
 * @function getDisputesReviewHistory
 * @description Fetches the review history of disputes processed by the manager, including those that are "ACCEPTED" or "REJECTED".
 *
 * @route GET /api/v2/manager/disputes/reviewed
 *
 * @param {Object} req - Express request object
 * @param {Object} req.currUser - The currently authenticated user object
 * @param {Object} req.userRole - The roles associated with the current user
 * @param {string} req.businessId - The business ID associated with the request
 * @param {Object} req.query - Query parameters for filtering and pagination
 * @param {string} [req.query.fromDate] - Optional filter for disputes reviewed after this date
 * @param {string} [req.query.toDate] - Optional filter for disputes reviewed before this date
 * @param {string} [req.query.status] - Optional filter for dispute workflow stage ("ACCEPTED" or "REJECTED")
 * @param {string} [req.query.reason] - Optional filter for dispute reason
 * @param {string} [req.query.gateway] - Optional filter for payment gateway
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=10] - Number of records per page (max 25)
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Success response with paginated list of reviewed disputes
 * @returns {Object} 400 - Bad request if user is not authorized or invalid parameters
 * @returns {Object} 500 - Internal server error if fetching fails
 *
 * @throws {AppError} If the current user, user role, or business ID is invalid, or if query parameters are invalid
 *
 * Steps:
 * 1. Extracts and validates the current user, user role, and business ID.
 * 2. Validates and applies filters for date range, status, reason, and gateway.
 * 3. Constructs a query to fetch disputes reviewed by the manager.
 * 4. Returns a paginated list of reviewed disputes or an empty list if business ID is missing.
 */
// @desc Fetching Dispute Reviews History which are Accepted and Rejected
const getDisputesReviewHistory = catchAsync(async (req, res) => {
    // @route   : GET /api/v2/manager/disputes/reviewed

    try {
        // Step 1 : Extracting the CurrUser , userRole and BusinessId from the request 
        const { currUser, userRole, businessId } = req;

        // Step 2 : Initializing the Variables for the pagination 
        const page = parseInt(req.query.page || 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 25);
        const offset = parseInt((page - 1) * limit);

        // Step 3 : Checking any Search from the Query Params
        const { fromDate, toDate, status, reason, gateway } = req.query;


        // Step 4 : validating the Manager and UserId 
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        };

        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("userId"));
        }

        if (!userRole.manager) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized)
        }

        // Step 5 : Validating the BusinessId
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(success_response(
                statusCodes.OK,
                "Successfully Fetched Assigned Disputes",
                {
                    totalPages: 0,
                    totalDisputes: 0,
                    page: 0,
                    limit: 10,
                    disputes: [],
                },
                false
            ))
        }

        // Step 6 : Validating From and To Date
        if (fromDate && !isValidDate(fromDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date!"));
        }

        if (toDate && !isValidDate(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date!"));
        }

        if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("From n", "To Date"));
        }

        // Step 7 : Validating the Payment Gateway
        if (gateway) {
            if (!GatewayNames.includes(gateway.toLowerCase())) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField("Gateway"));
            }
        }


        // Step 6 : Creating WhereClause  Object to Fetch the Disputes 
        const whereClause = {
            businessId: businessId,
            workflowStage: { [Op.in]: ["ACCEPTED", "REJECTED"] },
            managerId: currUser?.userId,
        }


        // Step 7 : Based on the Search Filtering the Disputes based on the Current Stage,reason ,Date and Gateway
        if (fromDate && toDate) {
            whereClause.lastStageAt = {
                [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
            };
        } else if (fromDate) {
            whereClause.lastStageAt = {
                [Op.gte]: new Date(fromDate)
            };
        } else if (toDate) {
            whereClause.lastStageAt = {
                [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
            };
        };

        if (status) {
            whereClause.workflowStage = status.toUpperCase();
        }

        if (reason) {
            whereClause.reason = {
                [Op.iLike]: `%${reason.trim()}%`
            }
        }

        if (gateway) {
            whereClause[Op.or] = [
                ...(whereClause[Op.or] || []),
                { gateway: { [Op.iLike]: `%${gateway}%` } },
            ];
        }


        // Step 8 : Fetching the count and the disputes based on whereClause object 
        const { count: totalDisputes, rows: reviewedDisputes } = await Dispute.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'disputeId', 'customId', 'analystId', 'paymentId', 'gateway', 'updatedStageAt', 'lastStageAt', 'reason', 'dueDate', 'state', 'workflowStage', 'createdAt', 'feedback', 'updatedAt'],
            limit: limit,
            offset: offset,
            order: [['dueDate', 'ASC']],
            raw: true,
        })


        const analystDetails = [];
        const disputeAnalysts = reviewedDisputes.map((dispute) => dispute.analystId);

        const uniqueAnalysts = new Set(disputeAnalysts);


        const analysts = await Analyst.findAll({ where: { id: { [Op.in]: Array.from(uniqueAnalysts) } }, attributes: ["id", "firstName", "lastName"], raw: true })



        analysts.forEach((analyst) => {
            const analystObj = {}
            if (uniqueAnalysts.has(analyst.id)) {
                analystObj.analystId = analyst.id;
                analystObj.analystName = `${analyst.firstName} ${analyst.lastName}`;
                analystDetails.push(analystObj)
            }
        })

        console.log(analystDetails);

        const disputes = reviewedDisputes.map((dispute) => {
            const disputeStaff = dispute?.analystId ? analystDetails?.find((analyst) => analyst?.analystId === dispute?.analystId) : null;
            const staffName = disputeStaff ? `${disputeStaff?.analystName}` : '';
            return {
                disputeId: dispute?.customId,
                paymentId: dispute?.paymentId,
                analystId: dispute?.analystId,
                staffName,
                amount: dispute?.amount,
                ChargeBackDate: dispute?.createdAt,
                reason: dispute?.reason,
                respondBy: dispute?.dueDate,
                state: dispute?.state,
                gateway: dispute?.gateway,
                type: dispute?.type,
                updatedAt: dispute?.updatedAt,
                currentStage: dispute?.workflowStage
            }
        })

        const totalPages = Math.ceil(totalDisputes / limit);

        const payload = {
            totalDisputes,
            totalPages,
            page,
            limit,
            disputes
        }


        // Step 10 : returning  the Fetched Dispute Response with the Pagination terms and total Count 
        return res.status(statusCodes.OK).json(success_response(
            statusCodes.OK,
            "Dispute Reviewed History Fetched",
            {
                payload
            },
            true,
        ))



    } catch (error) {
        console.log("Error in Fetching the Reviewed Dispute  Details!: ", error?.message);
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Failed Fetching Reviewed Dispute Data",
                { message: error?.message || "Fetching of Reviewed Disputes Failed" },
                false
            )
        )
    }
})


/**
 * @function getManagerProcessedDisputes
 * @description Fetches the list of disputes processed by the manager, filtered by workflow stage ("ACCEPTED" or "REJECTED").
 *
 * @route GET /api/v2/manager/disputes/processed/:stage
 *
 * @param {Object} req - Express request object
 * @param {Object} req.currUser - The currently authenticated user object
 * @param {Object} req.userRole - The roles associated with the current user
 * @param {string} req.businessId - The business ID associated with the request
 * @param {Object} req.params - Route parameters
 * @param {string} [req.params.stage] - Workflow stage to filter disputes ("ACCEPTED" or "REJECTED")
 * @param {Object} req.query - Query parameters for filtering and pagination
 * @param {string} [req.query.fromDate] - Optional filter for disputes processed after this date
 * @param {string} [req.query.toDate] - Optional filter for disputes processed before this date
 * @param {string} [req.query.gateway] - Optional filter for payment gateway
 * @param {string} [req.query.search] - Optional search string for custom dispute ID
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=10] - Number of records per page (max 25)
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Success response with paginated list of processed disputes
 * @returns {Object} 400 - Bad request if user is not authorized or invalid parameters
 * @returns {Object} 500 - Internal server error if fetching fails
 *
 * @throws {AppError} If the current user, user role, business ID, or stage is invalid, or if query parameters are invalid
 *
 * Steps:
 * 1. Extracts and validates the current user, user role, business ID, and stage.
 * 2. Validates and applies filters for date range, gateway, and search.
 * 3. Constructs a query to fetch processed disputes by the manager for the specified stage.
 * 4. Returns a paginated list of processed disputes or an empty list if business ID is missing.
 */

// @desc Get Manager Processed Disputes which are Accepted and Rejected Disputes
const getManagerProcessedDisputes = catchAsync(async (req, res) => {

    // @route   : GET/api/v2/manager/disputes/processed/:search
    try {

        // Step 1 : Extracting the Fields from the Request , params and Query Params
        const { currUser, userRole, businessId } = req;

        const { stage } = req.params;

        const { fromDate, toDate, gateway, search } = req.query;

        // Step 2 : Initializing the variables for the Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 25);
        const offset = (page - 1) * limit;

        // Step 3 : validating the Manager and UserId 
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        };

        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("userId"));
        }

        if (!userRole.manager) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized)
        }

        // Step 4 : Validating the BusinessId
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(success_response(
                statusCodes.OK,
                "Successfully Fetched Assigned Disputes",
                {
                    totalPages: 0,
                    totalDisputes: 0,
                    page: 0,
                    limit: 10,
                    disputes: [],
                },
                false
            ))
        }


        // Step 5 : Validating the Passed Stage 
        if (stage) {
            const validStatuses = ['ACCEPTED', 'REJECTED'];
            if (!validStatuses.includes(stage.toUpperCase())) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField("Stage"));
            }
        }


        // Step 6 : validating the From and To Date 
        if (fromDate && !isValidDate(fromDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date!"));
        }

        if (toDate && !isValidDate(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date!"));
        }

        if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("From Date", "To Date"));
        }

        // Step 7 : Validating the Payment Gateway
        if (gateway) {
            if (!GatewayNames.includes(gateway.toLowerCase())) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField("Gateway"));
            }
        };



        // Step 8 : Creating whereClause for Fetching the Disputes  
        const whereClause = {
            businessId,
            workflowStage: stage ? stage.toUpperCase() : undefined,
            managerId: currUser.userId
        };

        // Step 9 : Filtering Based on Search query of Custom Dispute Id , Date and the Payment Gateway


        if (fromDate && toDate) {
            whereClause.lastStageAt = {
                [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
            };
        } else if (fromDate) {
            whereClause.lastStageAt = {
                [Op.gte]: new Date(fromDate)
            };
        } else if (toDate) {
            whereClause.lastStageAt = {
                [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
            };
        }
        if (gateway) {
            whereClause[Op.or] = [
                ...(whereClause[Op.or] || []),
                { gateway: { [Op.iLike]: `%${gateway}%` } },
            ];
        }

        if (search) {
            whereClause.customId = {
                [Op.iLike]: `%${search}%`
            }
        };

        // Step 10 : Fetching the Dispute and Total disputes based on the whereClause Condition
        const { count: totalDisputes, rows: processedDisputes } = await Dispute.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'disputeId', 'customId', 'analystId', 'paymentId', 'gateway', 'updatedStageAt', 'lastStageAt', 'reason', 'dueDate', 'state', 'workflowStage', 'createdAt', 'feedback', 'updatedAt'],
            limit: limit,
            offset: offset,
            order: [['dueDate', 'ASC']],
            raw: true,
        })

        const analystDetails = [];
        const disputeAnalysts = processedDisputes.map((dispute) => dispute.analystId);

        const uniqueAnalysts = new Set(disputeAnalysts);


        const analysts = await Analyst.findAll({ where: { id: { [Op.in]: Array.from(uniqueAnalysts) } }, attributes: ["id", "firstName", "lastName"], raw: true })



        analysts.forEach((analyst) => {
            const analystObj = {}
            if (uniqueAnalysts.has(analyst.id)) {
                analystObj.analystId = analyst.id;
                analystObj.analystName = `${analyst.firstName} ${analyst.lastName}`;
                analystDetails.push(analystObj)
            }
        })

        console.log(analystDetails);

        const disputes = processedDisputes.map((dispute) => {
            const disputeStaff = dispute?.analystId ? analystDetails?.find((analyst) => analyst?.analystId === dispute?.analystId) : null;
            const staffName = disputeStaff ? `${disputeStaff?.analystName}` : '';
            return {
                disputeId: dispute?.customId,
                paymentId: dispute?.paymentId,
                analystId: dispute?.analystId,
                staffName,
                amount: dispute?.amount,
                ChargeBackDate: dispute?.createdAt,
                reason: dispute?.reason,
                respondBy: dispute?.dueDate,
                state: dispute?.state,
                gateway: dispute?.gateway,
                type: dispute?.type,
                updatedAt: dispute?.updatedAt,
                currentStage: dispute?.workflowStage
            }
        })

        const totalPages = Math.ceil(totalDisputes / limit);

        const payload = {
            totalDisputes,
            totalPages,
            page,
            limit,
            disputes
        }

        // Step 12 : returning  the Fetched Dispute Response with the Pagination terms and total Count 
        return res.status(statusCodes.OK).json(success_response(
            statusCodes.OK,
            "Processed Disputes Fetched Successfully!",
            {
                payload
            },
            true
        ))
    } catch (error) {
        console.log("Error in Fetching the Processed Dispute  Details!: ", error?.message);
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Failed Fetching Processed Dispute Data",
                { message: error?.message || "Fetching of Processed Disputes Failed" },
                false
            )
        )
    }
})




const managerDisputeWorkFlowController = { getSubmittedDisputes, getDisputesReviewHistory, getManagerProcessedDisputes };

export default managerDisputeWorkFlowController;