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
import helpers from "../../utils/helpers.util.js";


const isValidDate = (dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}


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



//2  @desc Fetching all the Dispute List of A Particular Business 
const getDisputesList = catchAsync(async (req, res) => {
    // route  : GET   /api/v2/merchant/list
    try {
        // Step 1 : Extract the filter fields from query and user details from request
        const { currUser, userRole, businessId } = req;
        const { disputeId, paymentId, state, fromDate, toDate, assigned } = req.query;
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

        // 2.3 Validating the Incoming userId is UUIDV4
        if (currUser?.userId && !helpers.isValidUUIDv4(currUser?.userId)) {
            throw new AppError(statusCodes.BAD_REQUEST,AppErrorCode.InvalidFieldFormat("userId"))
        }

        // 2.4 : Validating the User is Merchant or Not
        if (!userRole.merchant) {
            throw new AppError(
                statusCodes.BAD_REQUEST,
                AppErrorCode.UnAuthorizedField("merchant")
            );
        }

        // 2.5 validating the Incoming Business Id
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Dispute List Fetched SuccessFully!",
                    {
                        totalPages: 0,
                        totalDisputes: 0,
                        limit: 0,
                        page: 0,
                        disputes: []
                    },
                    true
                )
            )
        }

        // 2.6 Validating the BusinessId and it should be Valid UUIDV4 Format 
        if (businessId && !helpers.isValidUUIDv4(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("businessId"));
        }

        // 2.7 : Validate Internal State
        if (state) {
            const disputeState = state?.toUpperCase()?.split(' ')?.join('_');
            if (!disputeStatesArray.includes(disputeState)) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldValue("state"));
            }
        }
        
        // 2.8 : Validate fromDate and toDate String fields
        if (fromDate && !isValidDate(fromDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("fromDate", 'Date String'));
        }

        if (toDate && !isValidDate(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("toDate", 'Date String'));
        }

        if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("From Date", "To Date"))
        }


        // Step 3 : Generate a filter payload for disputes
        const filters = {
            merchantId: currUser?.userId,
            businessId
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
        if (fromDate && toDate) {
            filters.updatedStageAt = {
                [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
            };
        } else if (fromDate) {
            filters.updatedStageAt = {
                [Op.gte]: new Date(fromDate)
            };
        } else if (toDate) {
            filters.updatedStageAt = {
                [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
            };
        }

        // added the Merchant and analyst Disputes Filter
        if (assigned) {
            if (assigned.toLowerCase() === "merchant") {
                filters.analystId = null;
            } else if (assigned.toLowerCase() === "analyst") {
                filters.analystId = { [Op.ne]: null };
            }
        }


        // Step 4 : Fetch the disputes with filters
        const [{ count: totalDisputes, rows: disputes }, analysts] = await Promise.all([
            Dispute.findAndCountAll({
                where: filters,
                attributes:
                    ["id", "customId", "paymentId", "amount", "analystId", "dueDate", "gateway", "state", "createdAt", "reason"],
                limit: limit,
                offset: skip,
                order: [["createdAt", "DESC"]],
                raw: true
            }),
            Analyst.findAll({ where: { merchantId: currUser?.userId }, attributes: ['id', "firstName", "lastName"], raw: true })
        ]);

        // Step 5 : Fetching the Analyst Id and finding the Unique Id 
        const analystDetails = [];
        const disputeAnalysts = disputes.map((dispute) => dispute.analystId);

        const uniqueAnalysts = new Set(disputeAnalysts);

        // Step 6 : Creating an Object of Analyst with the Analyst Id and Name 
        analysts.forEach((analyst) => {
            const analystObj = {}
            if (uniqueAnalysts.has(analyst.id)) {
                analystObj.analystId = analyst.id;
                analystObj.analystName = `${analyst.firstName} ${analyst.lastName}`;
                analystDetails.push(analystObj)
            }
        })

        // Step 7 : Mapping the Dispute with the Name of the Analyst from Above Analyst Details Array 
        const disputesData = disputes.map((dispute) => {
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


        // Step 8 : Creating a Custom payload To generate the Response
        const payload = {
            totalDisputes,
            totalPages: Math.ceil((totalDisputes || 0) / limit),
            page,
            limit,
            disputes: disputesData
        }


        // Step 9 : Returning the Customized Payload 
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Dispute List Fetched Successfully!",
                {
                    payload
                },
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