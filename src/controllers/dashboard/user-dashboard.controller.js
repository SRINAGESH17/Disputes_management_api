import _ from "lodash";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import statusCodes from "../../constants/status-codes.constant.js"
import AppError from "../../utils/app-error.util.js";
import catchAsync from "../../utils/catch-async.util.js";
import { failed_response, success_response } from "../../utils/response.util.js"
import Dispute from "../../models/dispute.model.js";
import helpers from "../../utils/helpers.util.js";
import sequelize from "../../config/database.config.js";
import { Op } from "sequelize";


// Fetch User Business Gateways Dispute Count
const totalGatewayDisputes = catchAsync(async (req, res) => {
    // @route : GET  /api/v2/user/dashboard/gateway-disputes
    try {

        // Step 1 : Extract The User Details From Request
        const { userRole, currUser } = req;
        const businessId = req.businessId;

        // Step 2 : Validate The user Details and BusinessId
        if (_.isEmpty(userRole)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User Role'));
        }
        if (_.isEmpty(currUser?.uid)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }
        if (userRole?.userRef !== "MERCHANT" && userRole?.userRef !== "ANALYST") {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }

        // Step 3 : Return payload if no business account linked
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Gateway Disputes Count Fetched Successfully",
                    {
                        gateways: []
                    },
                    true
                )
            );
        }

        // Step 4 : validate businessId is UUIDv4
        if (!helpers.isValidUUIDv4(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('BusinessId'));
        }

         // where condition for fetching disputes
        const whereCondition = {
            businessId: businessId,
        }

        // If User is Analyst, then filter by analystId
        if (userRole?.userRef === "ANALYST") {
            whereCondition.analystId = userRole?.userId;
        }

        // Step 5: Fetch the Business gateway Dispute Counts
        console.time('Fetch Business Gateway Dispute Counts');
        let gatewaysCount = await Dispute.findAll({
            where: whereCondition,
            attributes: [
                'gateway',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalDisputes'],
                [
                    sequelize.fn(
                        'SUM',
                        sequelize.literal(`CASE WHEN state = 'won' THEN 1 ELSE 0 END`)
                    ),
                    'wonDisputes'
                ]
            ],
            group: ['gateway'],
            raw: true
        });
        console.timeEnd('Fetch Business Gateway Dispute Counts');
        console.log({gatewaysCount})

        // Format The Payload
        gatewaysCount = gatewaysCount?.map((gateway) => ({ gateway: gateway?.gateway, totalDisputes: +gateway?.totalDisputes, wonDisputes: +gateway?.wonDisputes })) || [];
        gatewaysCount.sort((a, b) => b.totalDisputes - a.totalDisputes);

        let totalWonDisputes = gatewaysCount?.reduce((sum, gateway) => sum += (+gateway?.wonDisputes || 0), 0) || 0;;
        let totalDisputes = gatewaysCount?.reduce((sum, gateway) => sum += (+gateway?.totalDisputes || 0), 0) || 0;;

        const resolutionRate = +((totalWonDisputes / totalDisputes) * 100).toFixed(2);

        // Step 6 : Sending Success Response
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Gateway Disputes Count Fetched Successfully",
                { totalDisputes, totalWonDisputes, resolutionRate, gateways: gatewaysCount },
                true
            )
        );
    } catch (error) {
        // Step 7 : Sending Error Response
        console.log("Error in Fetching User Business Gateway Disputes Count : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch User Business Gateways Disputes",
                {
                    message: error?.message
                },
                false
            )
        )
    }
});

// Fetch User dashboard Gateway Dispute Analytics
const gatewayDisputesAnalytics = catchAsync(async (req, res) => {
    // @route : GET  /api/v2/user/dashboard/gateway-analytics
    try {
        // Step 1 : Extract The User Details From Request
        const { userRole, currUser } = req;
        const range = req.query.range || "1m"; // "1m", "6m", "1y"
        const businessId = req.businessId;

        // Step 2 : Validate The User Details and BusinessId
        if (_.isEmpty(userRole)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User Role'));
        }
        if (_.isEmpty(currUser?.uid)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }
        if (userRole?.userRef !== "MERCHANT" && userRole?.userRef !== "ANALYST") {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }

        // Validate range is valid one
        if (range && !['1m', '6m', '1y'].includes(range)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldValue('Range'));
        }


        // Step 3 : Return payload if no business account linked
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Gateway Analytics Fetched Successfully",
                    {
                        gatewaysAnalytics: [],
                    },
                    true
                )
            );
        }

        // Step 4 : validate businessId is UUIDv4
        if (!helpers.isValidUUIDv4(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('BusinessId'));
        }

        // Set The Range Filter For Analytics
        let startDate = null;
        const now = new Date();
        switch (range) {
            case '1m':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case '6m':
                startDate = new Date(now.setMonth(now.getMonth() - 6));
                break;
            case '1y':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldValue('Range'));
        }

        
        // where condition for fetching disputes
        const whereCondition = {
            businessId: businessId,
            createdAt: { [Op.gte]: new Date(startDate) }
        }

        // If User is Analyst, then filter by analystId
        if (userRole?.userRef === "ANALYST") {
            whereCondition.analystId = userRole?.userId;
        }


        // Step 5: Fetch the Business gateway Dispute Counts
        console.time('Fetch Business Gateway Dispute Analytics');
        let gatewaysCount = await Dispute.findAll({
            where: whereCondition,
            attributes: [
                'gateway',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalDisputes'],
                [sequelize.fn('SUM', sequelize.literal(`CASE WHEN state = 'won' THEN 1 ELSE 0 END`)), 'wonDisputes'],
                [sequelize.fn('SUM', sequelize.literal(`CASE WHEN state = 'lost' THEN 1 ELSE 0 END`)), 'lostDisputes'],
            ],
            group: ['gateway'],
            raw: true
        });
        console.timeEnd('Fetch Business Gateway Dispute Analytics');

        // Format The Payload
        gatewaysCount = gatewaysCount?.map((gateway) => {
            return {
                gateway: gateway?.gateway,
                totalDisputes: +gateway?.totalDisputes,
                won: +gateway?.wonDisputes,
                lost: +gateway?.lostDisputes,
                pending: parseInt(gateway?.totalDisputes) - (parseInt(gateway?.wonDisputes) + parseInt(gateway?.lostDisputes))
            }
        });
        gatewaysCount.sort((a, b) => b.totalDisputes - a.totalDisputes);

        // Step 6 : Sending Success Response
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Gateway Dispute Analytics Fetched Successfully",
                { gatewaysAnalytics: gatewaysCount },
                true
            )
        );
    } catch (error) {
        // Step 7 : Sending Error Response
        console.log("Error in Fetching User Business Gateway Disputes Analytics : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch User Business Gateways analytics",
                {
                    message: error?.message
                },
                false
            )
        )
    }
});

// Fetch User Dashboard Business Lost Analytics
const fetchBusinessFinancialLost = catchAsync(async (req, res) => {
    // @route : GET  /api/v2/user/dashboard/financial-loss
    try {
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

        // Step 1 : Extract The User Details From Request
        const { userRole, currUser } = req;
        const month = req.query.month || months[new Date().getMonth()];
        const businessId = req.businessId;

        // Step 2 : Validate The User Details and BusinessId
        if (_.isEmpty(userRole)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User Role'));
        }
        if (_.isEmpty(currUser?.uid)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }
        if (userRole?.userRef !== "MERCHANT" && userRole?.userRef !== "ANALYST") {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }

        // Validate Month is valid one
        if (month && !months.includes(month)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldValue('Month'));
        }

        const monthNumber = months.findIndex((m) => m === month);
        const date = new Date(new Date().setMonth(monthNumber));
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

        // Step 3 : Return payload if no business account linked
        if (_.isEmpty(businessId)) {

            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Fetched Dispute Financial Loss Successfully",
                    {
                        totalAmountLost: 0,
                        financialLoss: [],
                    },
                    true
                )
            );
        }

        // Step 4 : validate businessId is UUIDv4
        if (!helpers.isValidUUIDv4(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('BusinessId'));
        }

         // where condition for fetching disputes
        const whereCondition = {
            businessId: businessId,
            createdAt: { [Op.gte]: startOfMonth, [Op.lte]: endOfMonth }
        }

        // If User is Analyst, then filter by analystId
        if (userRole?.userRef === "ANALYST") {
            whereCondition.analystId = userRole?.userId;
        }

        // Step 5: Fetch the Business gateway Dispute Counts
        console.time('Fetch Business Gateway Dispute Financial Loss Analytics');
        let gatewaysCount = await Dispute.findAll({
            where: whereCondition,
            attributes: [
                'gateway',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalDisputes'],
                [sequelize.fn('SUM', sequelize.literal(`CASE WHEN state = 'lost' THEN 1 ELSE 0 END`)), 'lostDisputes'],
                [sequelize.fn('SUM', sequelize.literal(`CASE WHEN state = 'lost' THEN amount ELSE 0 END`)),'lostAmount'],
            ],
            group: ['gateway'],
            raw: true
        });
        console.timeEnd('Fetch Business Gateway Dispute Financial Loss Analytics');

        let totalAmountLost = 0;
        // Format The Payload
        gatewaysCount = gatewaysCount?.map((gateway) => {
            const total = +gateway?.totalDisputes;
            const lost = +gateway?.lostDisputes;
            totalAmountLost += (+gateway?.lostAmount);
            return {
                gateway: gateway?.gateway,
                totalDisputes: total,
                lost,
                percentage: +((lost / total) * 100).toFixed(2)
            }
        });
        gatewaysCount.sort((a, b) => b.totalDisputes - a.totalDisputes);

        // Step 6 : Sending Success Response
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Fetched Dispute Financial Loss Successfully",
                { totalAmountLost, financialLoss: gatewaysCount },
                true
            )
        );
    } catch (error) {
        // Step 7 : Sending Error Response
        console.log("Error in Fetching User Business Gateway Disputes Financial Lost : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch User Business Gateways Financial Lost",
                {
                    message: error?.message
                },
                false
            )
        )
    }
});

// Fetch User Dashboard Dispute Common Reason Analytics
const fetchDisputeCommonReasonAnalytics = catchAsync(async (req, res) => {
    // @route : GET  /api/v2/user/dashboard/reason-analytics
    try {
        // Step 1 : Extract The User Details From Request
        const { userRole, currUser } = req;
        const { reason = "product not delivered", fromDate, toDate } = req.query;

        const businessId = req.businessId;

        // Step 2 : Validate The User Details and BusinessId
        if (_.isEmpty(userRole)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User Role'));
        }
        if (_.isEmpty(currUser?.uid)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }
        if (userRole?.userRef !== "MERCHANT" && userRole?.userRef !== "ANALYST") {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }

        // Validate Date filter
        if (fromDate && isNaN(Date.parse(fromDate))) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("fromDate", 'Date String'));
        }
        if (toDate && isNaN(Date.parse(toDate))) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("toDate", 'Date String'));
        }
        if (fromDate && toDate) {
            if (new Date(fromDate) > new Date(toDate)) {
                throw new AppError(statusCodes.BAD_REQUEST, "Invalid Dates. fromDate Must be Less Then toDate");
            }
        }

        // Validate reason
        if (_.isEmpty(reason)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('reason'));
        }


        // Step 3 : Return payload if no business account linked
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Successfully Fetched Common Reason analytics",
                    {
                        reasonAnalytics: [],
                    },
                    true
                )
            );
        }

        // Step 4 : validate businessId is UUIDv4
        if (!helpers.isValidUUIDv4(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('BusinessId'));
        }

           // where condition for fetching disputes
        const whereCondition = {
            businessId: businessId,
        }

          // If User is Analyst, then filter by analystId
        if (userRole?.userRef === "ANALYST") {
            whereCondition.analystId = userRole?.userId;
        }

          // Step 7: Apply date filter (if fromDate/toDate provided) on updatedAt field
        if (fromDate && toDate) {
            whereCondition.createdAt = {
                [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
            };
        } else if (fromDate) {
            whereCondition.createdAt = {
                [Op.gte]: new Date(fromDate)
            };
        } else if (toDate) {
            whereCondition.createdAt = {
                [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
            };
        }      

        // Step 5: Fetch the Business gateway Dispute Counts
        console.time('Fetch Business Gateway Dispute Common Reason Analytics');
        let gatewaysCount = await Dispute.findAll({
            where: whereCondition,
            attributes: [
                'gateway',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalDisputes'],
                [sequelize.fn('SUM', sequelize.literal(`CASE WHEN LOWER(reason) ~ '${reason.toLowerCase()}' THEN 1 ELSE 0 END`)), 'reasonDisputes'],
            ],
            group: ['gateway'],
            raw: true
        });
        console.timeEnd('Fetch Business Gateway Dispute Common Reason Analytics');
        gatewaysCount = gatewaysCount?.map((record) => {
            const total = +record?.totalDisputes;
            const reasonDisputes = +record?.reasonDisputes;
            return {
                gateway: record?.gateway,
                totalDisputes: total,
                reasonDisputes,
                percentage: +((reasonDisputes / total) * 100).toFixed(2)
            }
        });

        gatewaysCount.sort((a, b) => b.totalDisputes - a.totalDisputes);

        // Step 6 : Sending Success Response
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetched Common Reason analytics",
                { gatewaysCount },
                true
            )
        );
    } catch (error) {
        // Step 7 : Sending Error Response
        console.log("Error in Fetching User Business Gateway Disputes Common reason Analytics : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch User Business Common reason Analytics",
                {
                    message: error?.message
                },
                false
            )
        )
    }
});


const UserDashboardController = {
    totalGatewayDisputes,
    gatewayDisputesAnalytics,
    fetchBusinessFinancialLost,
    fetchDisputeCommonReasonAnalytics,
};

export default UserDashboardController;
