import _ from "lodash";
import { disputeStatesArray } from "../../constants/dispute-states.constant.js";
import statusCodes from "../../constants/status-codes.constant.js";
import catchAsync from "../../utils/catch-async.util.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import AppError from "../../utils/app-error.util.js";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import { Op } from "sequelize";
import Dispute from "../../models/dispute.model.js";
import Analyst from "../../models/analyst.model.js";

// 1.Fetch Dispute States
const getDisputeStates = catchAsync(async (req, res) => {
    // @description : Fetch Internal Disputes States
    try {

        // Format the states in capitalize Font and separate it if it has more then one word
        const states = disputeStatesArray?.map((state) => state?.toLowerCase()?.split('_')?.map(word => word?.[0]?.toUpperCase() + word?.slice(1)).join(' '));

        return res.status(statusCodes.ACCEPTED).json(
            success_response(
                statusCodes.ACCEPTED,
                "Disputes States Fetch Successfully",
                { dispute_states: states },
                true
            )
        )
    } catch (error) {
        console.log("Error in fetching internal dispute states controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed To Fetch Disputes States",
                    {
                        message: error?.message || "Disputes States Fetching Failed",
                    },
                    false
                )
            );
    }
});


// 2.Fetch Merchant Disputes List
const getDisputesList = catchAsync(async (req, res) => {
    // @description : Fetch Disputes List With filters
    try {
        // Step 1 : Extract the filter fields from query and user details from request
        const { currUser, userRole } = req;
        const { disputeId, paymentId, state, fromDate, toDate } = req.query;
        const staffId = parseInt(req.query?.staffId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Step 2 : Validate filter fields if exist and request user
        // 2.1: Validate User is Merchant or not
        if (_.isEmpty(currUser)) {
            throw new AppError(
                statusCodes.BAD_REQUEST,
                AppErrorCode.UnAuthorizedField("User")
            );
        }

        // 2.2 : Checking For the UserId
        if (!currUser?.userId) {
            throw new AppError(
                statusCodes.BAD_REQUEST,
                AppErrorCode.UnAuthorizedField("User")
            );
        }

        // 2.3 : Validating the User is Merchant or Not
        if (!userRole.merchant) {
            throw new AppError(
                statusCodes.BAD_REQUEST,
                AppErrorCode.UnAuthorizedField("merchant")
            );
        }

        // 2.4 : Validate Internal State
        if (state) {
            const disputeState = state?.toUpperCase()?.split(' ')?.join('_');
            if (!disputeStatesArray.includes(disputeState)) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldValue("state"));
            }
        }
        // 2.5 : Validate fromDate and toDate String fields
        if (fromDate && isNaN(Date.parse(fromDate))) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("fromDate", 'Date String'));
        }
        if (toDate && isNaN(Date.parse(toDate))) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("toDate", 'Date String'));
        }

        // Step 3 : Generate a filter payload for disputes
        const filters = {
            merchantId: currUser?.userId,
        };

        // add Dispute Id filter
        if (disputeId) {
            filters[Op.or] = [
                { disputeId: { [Op.iLike]: `%${disputeId}%` } },
                { customId: { [Op.iLike]: `%${disputeId}%` } },
            ];
        }

        // add paymentId filter
        if (paymentId) {
            filters[Op.or] = [
                ...(filters[Op.or] || []),
                { paymentId: { [Op.iLike]: `%${paymentId}%` } },
            ];
        }

        // add state filter
        if (state) {
            filters[Op.or] = [
                ...(filters[Op.or] || []),
                { state: { [Op.iRegexp]: state } },
            ];
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
        if (staffId) {
            filters.staffId = staffId;
        }

        // Step 4 : Fetch the disputes with filters

        const [disputes, totalDisputes, staff] = await Promise.all([
            // Fetch Disputes with filters
            Dispute.findAll({
                where: filters,
                attributes: {
                    exclude: ['createdAt', 'ipAddress', 'currency', 'reasonCode', 'merchantId']
                },
                order: [['updatedAt', 'DESC']],
                limit,
                offset: skip,
                raw: true
            }),

            // Fetch the Total Number of Disputes
            Dispute.count({ where: filters }),

            // Fetch Staff 
            Analyst.findAll({ where: { merchantId: filters.merchantId }, attributes: ['id', 'firstName', 'lastName'], raw: true })
        ]);

        const disputesData = disputes.map((dispute) => {
            const disputeStaff = dispute?.analystId ? staff?.find((st) => st?.id === dispute?.analystId) : null;
            const staffName = disputeStaff ? `${disputeStaff?.firstName} ${disputeStaff?.lastName}` : '';
            return {
                disputeId: dispute?.customId,
                gatewayDisputeId: dispute?.disputeId,
                transactionId: dispute?.paymentId,
                analystId: dispute?.analystId,
                staffName,
                amount: dispute?.amount,
                ChargeBackDate: dispute?.statusUpdatedAt,
                reason: dispute?.reason,
                respondBy: dispute?.dueDate,
                status: dispute?.status,
                state: dispute?.state,
                gateway: dispute?.gateway,
                type: dispute?.type,
                updatedAt: dispute?.updatedAt,
                currentStage:dispute?.workflowStage
            }
        })
        // Step 5 : Generate Paginated response payload
        const payload = {
            totalDisputes,
            totalPages: Math.ceil((totalDisputes || 0) / limit),
            page,
            limit,
            disputes: disputesData
        }
        // Step 6 : Return Response

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Disputes Fetched Successfully",
                payload,
                true
            )
        )
    } catch (error) {
        console.log("Error in fetching disputes controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed To Fetch Disputes List",
                    {
                        message: error?.message || "Disputes List Fetching Failed",
                    },
                    false
                )
            );
    }
});



const merchantDisputeController = {
    getDisputeStates,
    getDisputesList
}

export default merchantDisputeController;