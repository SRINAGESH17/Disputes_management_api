import _ from "lodash";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import statusCodes from "../../../constants/status-codes.constant.js"
import AppError from "../../../utils/app-error.util.js";
import catchAsync from "../../../utils/catch-async.util.js";
import { failed_response, success_response } from "../../../utils/response.util.js"
import Dispute from "../../../models/dispute.model.js";
import helpers from "../../../utils/helpers.util.js";
import sequelize from "../../../config/database.config.js";
import { Op } from "sequelize";


// Fetch Merchant Business Gateways Dispute Count
const totalGatewayDisputes = catchAsync(async (req, res) => {
    // @route : GET  /api/v2/merchant/dashboard/gateway-disputes
    try {

        // Step 1 : Extract The User Details From Request
        const { userRole, currUser } = req;
        const businessId = req.businessId;

        // Step 2 : Validate The Merchant Details and BusinessId
        if (_.isEmpty(userRole)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User Role'));
        }
        if (_.isEmpty(currUser?.uid)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }
        if (userRole?.userRef !== "MERCHANT") {
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

        // Step 5: Fetch the Business gateway Dispute Counts
        console.time('Fetch Business Gateway Dispute Counts');
        let gatewaysCount = await Dispute.findAll({
            where: { businessId },
            attributes: [
                'gateway',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalDisputes'],
                [
                    sequelize.fn(
                        'SUM',
                        sequelize.literal(`CASE WHEN state = 'Won' THEN 1 ELSE 0 END`)
                    ),
                    'wonDisputes'
                ]
            ],
            group: ['gateway'],
            raw: true
        });
        console.timeEnd('Fetch Business Gateway Dispute Counts');

        // Format The Payload
        gatewaysCount = gatewaysCount?.map((gateway) => ({ gateway: gateway?.gateway, totalDisputes: +gateway?.totalDisputes, wonDisputes: +gateway?.wonDisputes })) || [];
        gatewaysCount.sort((a, b) => b.totalDisputes - a.totalDisputes);


        let totalWonDisputes = gatewaysCount?.reduce((sum, gateway) => sum += (+gateway?.wonDisputes || 0), 0) || 0;;
        let totalDisputes = gatewaysCount?.reduce((sum, gateway) => sum += (+gateway?.totalDisputes || 0), 0) || 0;;

        const resolutionRate = +((totalWonDisputes / totalDisputes) * 100).toFixed(2);


        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Gateway Disputes Count Fetched Successfully",
                { totalDisputes, totalWonDisputes, resolutionRate, gateways: gatewaysCount, },
                true
            )
        );
    } catch (error) {
        console.log("Error in Fetching Merchant Business Gateway Disputes Count : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch Business Gateways Disputes",
                {
                    message: error?.message
                },
                false
            )
        )
    }
});


// Fetch Merchant dashboard Gateway Dispute Analytics
const gatewayDisputesAnalytics = catchAsync(async (req, res) => {
    // @route : GET  /api/v2/merchant/dashboard/gateway-analytics
    try {

        // Step 1 : Extract The User Details From Request
        const { userRole, currUser } = req;
        const range = req.query.range || "1m"; // "1m", "6m", "1y"
        const businessId = req.businessId;

        // Step 2 : Validate The Merchant Details and BusinessId
        if (_.isEmpty(userRole)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User Role'));
        }
        if (_.isEmpty(currUser?.uid)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }
        if (userRole?.userRef !== "MERCHANT") {
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


        // Step 5: Fetch the Business gateway Dispute Counts
        console.time('Fetch Business Gateway Dispute Analytics');
        let gatewaysCount = await Dispute.findAll({
            where: { createdAt: { [Op.gte]: new Date(startDate) }, businessId },
            attributes: [
                'gateway',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalDisputes'],
                [
                    sequelize.fn(
                        'SUM',
                        sequelize.literal(`CASE WHEN state = 'Won' THEN 1 ELSE 0 END`)
                    ),
                    'wonDisputes'
                ],
                [
                    sequelize.fn(
                        'SUM',
                        sequelize.literal(`CASE WHEN state = 'Lost' THEN 1 ELSE 0 END`)
                    ),
                    'lostDisputes'
                ],
            ],
            group: ['gateway'],
            raw: true
        });
        console.log("test : ", gatewaysCount);
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

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Gateway Dispute Analytics Fetched Successfully",
                { gatewaysAnalytics: gatewaysCount },
                true
            )
        );
    } catch (error) {
        console.log("Error in Fetching Merchant Business Gateway Disputes Analytics : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch Business Gateways analytics",
                {
                    message: error?.message
                },
                false
            )
        )
    }
});

// Fetch Merchant Dashboard Business Lost Analytics
const fetchBusinessFinancialLost = catchAsync(async (req, res) => {
    // @route : GET  /api/v2/merchant/dashboard/financial-loss
    try {
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

        // Step 1 : Extract The User Details From Request
        const { userRole, currUser } = req;
        const month = req.query.month || months[new Date().getMonth()];
        console.log("month : ", month);
        const businessId = req.businessId;

        // Step 2 : Validate The Merchant Details and BusinessId
        if (_.isEmpty(userRole)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User Role'));
        }
        if (_.isEmpty(currUser?.uid)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }
        if (userRole?.userRef !== "MERCHANT") {
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


        // Step 5: Fetch the Business gateway Dispute Counts
        console.time('Fetch Business Gateway Dispute Financial Loss Analytics');
        let gatewaysCount = await Dispute.findAll({
            where: { createdAt: { [Op.gte]: startOfMonth, [Op.lte]: endOfMonth }, businessId },
            attributes: [
                'gateway',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalDisputes'],
                [
                    sequelize.fn(
                        'SUM',
                        sequelize.literal(`CASE WHEN state = 'Lost' THEN 1 ELSE 0 END`)
                    ),
                    'lostDisputes'
                ],
                [
                    sequelize.fn(
                        'SUM',
                        sequelize.literal(`CASE WHEN state = 'Lost' THEN amount ELSE 0 END`)
                    ),
                    'lostAmount'
                ],
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

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Fetched Dispute Financial Loss Successfully",
                { totalAmountLost, financialLoss: gatewaysCount },
                true
            )
        );
    } catch (error) {
        console.log("Error in Fetching Merchant Business Gateway Disputes Financial Lost : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch Business Gateways Financial Lost",
                {
                    message: error?.message
                },
                false
            )
        )
    }
});


// Fetch Dashboard Dispute Common Reason Analytics
const fetchDisputeCommonReasonAnalytics = catchAsync(async (req, res) => {
    // @route : GET  /api/v2/merchant/dashboard/reason-analytics
    try {
        // Step 1 : Extract The User Details From Request
        const { userRole, currUser } = req;
        const { reason = "unauthorized transactions", fromDate, toDate } = req.query;

        const businessId = req.businessId;

        // Step 2 : Validate The Merchant Details and BusinessId
        if (_.isEmpty(userRole)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User Role'));
        }
        if (_.isEmpty(currUser?.uid)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }
        if (userRole?.userRef !== "MERCHANT") {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField('User'));
        }

        if (fromDate && isNaN(Date.parse(fromDate))) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("fromDate", 'Date String'));
        }
        if (toDate && isNaN(Date.parse(toDate))) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("toDate", 'Date String'));
        }
        if (fromDate && toDate) {
            if (new Date(fromDate).getMilliseconds() > new Date(toDate).getMilliseconds()) {
                throw new AppError(statusCodes.BAD_REQUEST, "Invalid Dates. fromDate Must be Less Then toDate");
            }
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

        let filter = {};

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt[Op.gte] = new Date(fromDate);
            if (toDate) filter.createdAt[Op.lte] = new Date(toDate);
        }
        if (businessId) {
            filter.businessId = businessId;
        }
        if (reason) {
            filter.reason = { [Op.iRegexp]: reason };
        }

        // Step 5: Fetch the Business gateway Dispute Counts
        console.time('Fetch Business Gateway Dispute Common Reason Analytics');
        let gatewaysCount = await Dispute.findAll({
            where: filter,
            attributes: [
                'gateway',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalDisputes'],
                [
                    sequelize.fn(
                        'SUM',
                        sequelize.literal(`CASE WHEN state = 'Lost' THEN 1 ELSE 0 END`)
                    ),
                    'lostDisputes'
                ],
                [
                    sequelize.fn(
                        'SUM',
                        sequelize.literal(`CASE WHEN state = 'Lost' THEN amount ELSE 0 END`)
                    ),
                    'lostAmount'
                ],
            ],
            group: ['gateway'],
            raw: true
        });
        console.timeEnd('Fetch Business Gateway Dispute Common Reason Analytics');

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

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Fetched Dispute Financial Lost Successfully",
                { totalAmountLost, financialLoss: gatewaysCount },
                true
            )
        );
    } catch (error) {
        console.log("Error in Fetching Merchant Business Gateway Disputes Financial Lost : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch Business Gateways Financial Lost",
                {
                    message: error?.message
                },
                false
            )
        )
    }
});

const merchantDashboardController = {
    totalGatewayDisputes,
    gatewayDisputesAnalytics,
    fetchBusinessFinancialLost,

};

export default merchantDashboardController;