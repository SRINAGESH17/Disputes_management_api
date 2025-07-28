import _ from "lodash";
import AppError from "../../utils/app-error.util.js";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import catchAsync from "../../utils/catch-async.util.js";
import statusCodes from "../../constants/status-codes.constant.js";
import Dispute from "../../models/dispute.model.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import helpers from "../../utils/helpers.util.js";
import { GatewayNames } from "../../constants/gateways.constant.js";
import { Op } from "sequelize";

const isValidDate = (dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

// @desc  Get Submitted to Payment Gateway Disputes
const getSubmittedToGatewayDisputes = catchAsync(async (req, res) => {

    // @route  : GET / /api/v2/disputes/submitted/gateway
    try {
        // Step 1 : Fetching the UserId ,userRole and business Id from the request 

        const { userId } = req.currUser;
        const user = req.userRole;
        const businessId = req.businessId;

        // Step 2 : For Filtering the Disputes we are taking the Date and gateway and custom DisputeId 
        const { fromDate, toDate, gateway, customDisputeId } = req.query;

        // Step 3 : For pagination Initializing the Variables and defining the default values
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 20);
        const offset = (page - 1) * limit;


        // Step 4 : Validating the Data which is coming from the request 

        // 4.1 Validating the Incoming UserId 
        if (_.isEmpty(userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("userId"))
        };

        // 4.2 If UserId validating the UserId is UUID or not 
        if (userId && !helpers.isValidUUIDv4(userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("userId"));
        };

        // 4.3 Checking the user Role from the Request 
        if (!user || !(user.manager || user.merchant || user.analyst)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        }


        // 4.4 Validating the BusinessId From the request and Returning the response  
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Submitted to Gateway Disputes Fetched Successfully!",
                    {
                        totalPages: 0,
                        totalDisputes: 0,
                        page: 0,
                        limit: 10,
                        disputes: []
                    },
                    true

                )
            )
        }


        // Step 5 : Validating the Filters

        // 5.1 Validating the From and to Date 
        if (fromDate && !isValidDate(fromDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date!"));
        }

        if (toDate && !isValidDate(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date!"));
        }

        if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("From Date", "To Date"));
        }

        //  5.2 : validating the gateway 
        if (gateway) {
            if (!GatewayNames.includes(gateway.toLowerCase())) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField("Gateway"));
            }
        }


        // Step 6: Creating a WhereClause To search for the Disputes based on the condition 
        const whereClause = {
            businessId,
            isSubmitted: true,
            workflowStage: "ACCEPTED",

        }

        // Step 7 : If there is Filters then based on the filters we are adding the filters to whereClause
        if (fromDate && toDate) {
            whereClause.updatedAt = {
                [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
            };
        } else if (fromDate) {
            whereClause.updatedAt = {
                [Op.gte]: new Date(fromDate)
            };
        } else if (toDate) {
            whereClause.updatedAt = {
                [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
            };
        }

        if (gateway) {
            whereClause[Op.or] = [
                ...(whereClause[Op.or] || []),
                { gateway: { [Op.iLike]: `%${gateway}%` } },
            ];
        }

        if (customDisputeId) {
            whereClause.customId = {
                [Op.iLike]: `%${customDisputeId}%`
            }
        }

        // Step 8 : Based on the Role Fetching the Disputes attached to the users which are submitted to Gateway 
        let disputes;
        let totalDisputes
        if (user.merchant) {
            ({ rows: disputes, count: totalDisputes } = await Dispute.findAndCountAll({
                where: { ...whereClause, merchantId: userId },
                attributes: ["id", "state", "customId", "paymentId", "amount", 'reason', "workflowStage", "dueDate", "gateway", "disputeId", "updatedAt"],
                limit,
                offset,
                raw: true,
            }));
        } else if (user.analyst) {
            ({ rows: disputes, count: totalDisputes } = await Dispute.findAll({
                where: { ...whereClause, analystId: userId },
                attributes: ["id", "state", "customId", "paymentId", "amount", 'reason', "workflowStage", "dueDate", "gateway", "disputeId", "updatedAt"],
                limit,
                offset,
                raw: true,
            }));
        } else if (user.manager) {
            ({ rows: disputes, count: totalDisputes } = await Dispute.findAll({
                where: { ...whereClause, managerId: userId },
                attributes: ["id", "state", "customId", "paymentId", "amount", 'reason', "workflowStage", "dueDate", "gateway", "disputeId", "updatedAt"],
                limit,
                offset,
                raw: true,
            }));
        }

        // step 9 : Creating the Customized dispute Data To send in the payload
        const customizedDispute = disputes.map((dispute) => {
            return {
                customId: dispute?.customId,
                paymentGatewayStatus: dispute?.state,
                paymentId: dispute?.paymentId,
                amount: dispute?.amount,
                reason: dispute?.reason,
                status: dispute?.workflowStage,
                respondBy: dispute?.dueDate,
                gateway: dispute?.gateway,
                submittedAt: dispute?.updatedAt,
            }
        })

        // step 10: creating a custom payload to send in the response 
        const payload = {
            totalDisputes,
            totalPages: Math.ceil(totalDisputes / limit),
            page,
            limit,
            customizedDispute
        }

        // Step 11: Sending the response with created Payload 
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetched Submitted Gateway Disputes",
                { payload },
                true
            )
        )
    } catch (error) {
        console.log(error?.message || "Error while Fetching the Submitted to Payment Gateway Disputes");
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch Submitted to Gateway Disputes",
                { message: error?.message || "Fetching of Submitted to Gateway Disputes Failed" },
                false
            )
        )
    }
})





const GatewaySubmittedDisputes = {
    getSubmittedToGatewayDisputes
};


export default GatewaySubmittedDisputes;