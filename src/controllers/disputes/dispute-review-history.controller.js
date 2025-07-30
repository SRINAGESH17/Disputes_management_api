import _ from "lodash";
import { Op } from "sequelize";
import Dispute from "../../models/dispute.model.js";
import catchAsync from "../../utils/catch-async.util.js";
import AppError from "../../utils/app-error.util.js";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import statusCodes from "../../constants/status-codes.constant.js";
import { GatewayNames } from "../../constants/gateways.constant.js";
import { success_response, failed_response } from "../../utils/response.util.js";
import helpers from "../../utils/helpers.util.js";

const isValidDate = (dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}


const getDisputesReviewedHistory = catchAsync(async (req, res) => {
    // @route GET /api/v2/merchant/disputes/reviewed/history
    try {
        // Step-1: Destructuring currUser and userRole from request
        const { currUser, userRole, businessId } = req;
        const { fromDate, toDate, gateway, status, search } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Step-2.1: Validate that the current user is authorized as a merchant
        if (!currUser && !userRole.merchant) {
            throw new AppError(
                statusCodes.UNAUTHORIZED,
                AppErrorCode.YouAreNotAuthorized
            );
        }
        
        if (currUser?.userId && !helpers.isValidUUIDv4(currUser?.userId)) {
            throw new AppError(
                statusCodes.BAD_REQUEST,
                AppErrorCode.InvalidFieldFormat("userId")
            );
        };
        
        // Step-2: Validate if merchant has selected an active business account
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Disputes History Fetched Successfully!",
                    {
                        totalPages: 0,
                        totalDisputes: 0,
                        page: 0,
                        limit: 0,
                        disputes: [],
                    },
                    true
                )
            )
        }

        if (businessId && !helpers.isValidUUIDv4(businessId)) {
            throw new AppError(
                statusCodes.BAD_REQUEST,
                AppErrorCode.InvalidFieldFormat("businessId"),
            );
        };


        if (fromDate && !isValidDate(fromDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date"));
        }

        if (toDate && !isValidDate(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date"));
        }

        if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("To Date", "From Date"));
        }

        if (gateway && !GatewayNames.includes(gateway.toLowerCase())) {
            throw new AppError(
                statusCodes.BAD_REQUEST,
                AppErrorCode.InvalidFieldFormat("gateway"),
            )
        };



        // Step-3: Construct initial where condition for filtering disputes
        const statusArray = ["ACCEPTED", "PENDING"]
        const whereCondition = {
            businessId: businessId,
            workflowStage: { [Op.in]: statusArray }
        };

        if (userRole.merchant) {
            whereCondition.merchantId = currUser?.userId;
        } else if (userRole.analyst) {
            whereCondition.analystId = currUser?.userId;
        }

        // Step-6: Validate fromDate and toDate formats

        // Step-6.1: Apply date filtering on updatedAt based on provided dates
        if (fromDate && toDate) {
            whereCondition.updatedAt = {
                [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
            };
        } else if (fromDate) {
            whereCondition.updatedAt = {
                [Op.gte]: new Date(fromDate)
            };
        } else if (toDate) {
            whereCondition.updatedAt = {
                [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
            };
        }


        // Step-3.1: Apply workflowStage filtering logic
        if (status) {
            if (statusArray.includes(status?.toUpperCase())) {
                whereCondition.workflowStage = status?.toUpperCase();
            } else {
                throw new AppError(
                    statusCodes.BAD_REQUEST,
                    AppErrorCode.fieldNotExist(status)
                );
            }
        }

        // Step-5: Add search filter for dispute customId (if provided)
        if (search) {
            whereCondition.customId = { [Op.iLike]: `%${search}%` };
        }



        // Step-8: Fetch all disputes reviewed history with pagination, count, and latest first sorting
        const { count: totalDisputesCount, rows: disputes } = await Dispute.findAndCountAll({
            where: whereCondition,
            attributes: [
                "id",
                "customId",
                "paymentId",
                "gateway",
                "state",
                "reason",
                "lastStage",
                "lastStageAt",
                "updatedStage",
                "updatedStageAt",
                "workflowStage",
                "createdAt",
                "updatedAt"
            ],
            order: [['updatedAt', 'DESC']],
            offset,
            limit,
            raw: true
        });


        // Step-13: Send success response with transformed dispute list
        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "Disputes Submitted By Analyst fetched Successfully",
                    {
                        totalDisputesCount,
                        totalPages: Math.ceil(totalDisputesCount / limit),
                        page,
                        limit,
                        disputes,
                    },
                    true
                )
            );

    } catch (error) {
        // Step-14: Catch any errors and return error response
        console.log("Error in fetching disputes submitted by analyst  : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed To Fetch Disputes Submitted By analyst",
                    {
                        message: error?.message || "Disputes Submitted By Analyst Fetching Failed",
                    },
                    false
                )
            );
    }
});


const getDisputesHistory = {
    getDisputesReviewedHistory
};

export default getDisputesHistory;