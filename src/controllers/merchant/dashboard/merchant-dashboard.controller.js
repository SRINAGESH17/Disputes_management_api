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
import { GatewayNames } from "../../../constants/gateways.constant.js";


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
        const { reason = "product not delivered", fromDate, toDate } = req.query;

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

        // Validate Date filter
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

        let filter = {};

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt[Op.gte] = new Date(fromDate);
            if (toDate) filter.createdAt[Op.lte] = new Date(toDate);
        }
        if (businessId) {
            filter.businessId = businessId;
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
                        sequelize.literal(`CASE WHEN LOWER(reason) ~ '${reason.toLowerCase()}' THEN 1 ELSE 0 END`)
                    ),
                    'reasonDisputes'
                ],
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

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetched Common Reason analytics",
                { gatewaysCount },
                true
            )
        );
    } catch (error) {
        console.log("Error in Fetching Merchant Business Gateway Disputes Common reason Analytics : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch Business Common reason Analytics",
                {
                    message: error?.message
                },
                false
            )
        )
    }
});

/********************************************************** Dashboard Specific Gateway Feed ***********************/

// Fetch Specific Business Specific Gateway Disputes Count
const fetchBusinessGatewayDisputesCount = catchAsync(async (req, res) => {
    // @route : GET  /api/v2/merchant/dashboard/:gateway/counts
    try {
        // Step 1 : Extract The User Details From Request
        const { userRole, currUser } = req;
        const { gateway } = req.params;

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

        // Check is the Valid Gateway
        if (!GatewayNames.includes(gateway?.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('Valid Gateway'));
        }

        // Step 3 : Return payload if no business account linked
        if (_.isEmpty(businessId)) {

            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Successfully Fetched Gateway Disputes Count",
                    {
                        gateway,
                        disputes: {
                            total: 0,
                            pending: 0,
                            won: 0,
                            lost: 0
                        }
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
        console.time(`Fetch Business ${gateway} Gateway Disputes Count`);
        let disputes = await Dispute.findOne({
            where: { businessId, gateway },
            attributes: [
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
            raw: true
        });
        console.timeEnd(`Fetch Business ${gateway} Gateway Disputes Count`);

        if (_.isEmpty(disputes)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Successfully Fetched Gateway Disputes Count",
                    {
                        gateway,
                        disputes: {
                            total: 0,
                            pending: 0,
                            won: 0,
                            lost: 0
                        }
                    },
                    true
                )
            );
        }

        const total = parseInt(disputes?.totalDisputes);
        const won = parseInt(disputes?.wonDisputes);
        const lost = parseInt(disputes?.lostDisputes);
        const counts = {
            total,
            pending: total - (won + lost),
            won,
            lost,
        }


        // Return payload
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetched Gateway Disputes Count",
                { gateway, disputes: counts },
                true
            )
        );
    } catch (error) {
        console.log("Error in Fetching Merchant Business Gateway Disputes Count : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch Gateway Dispute Count",
                {
                    message: error?.message
                },
                false
            )
        )

    }
});

// Fetch Specific Gateway Dispute Analytics
const fetchBusinessGatewayDisputeAnalytics = catchAsync(async (req, res) => {
    // @route : GET  /api/v2/merchant/dashboard/:gateway/analytics
    try {

        // Step 1 : Extract The User Details From Request
        const { userRole, currUser } = req;
        const { gateway } = req.params;
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
        // Check is the Valid Gateway
        if (!GatewayNames.includes(gateway?.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('Valid Gateway'));
        }


        // Step 3 : Return payload if no business account linked
        if (_.isEmpty(businessId)) {

            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Gateway Analytics Fetched Successfully",
                    {
                        gateway,
                        gatewaysAnalytics: {
                            total,
                            pending: 0,
                            won: 0,
                            lost: 0,
                            winPercentage: 0,
                            lostPercentage: 0,
                            pendingPercentage: 0
                        },
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
        console.time(`Fetch Business ${gateway} Gateway Dispute Analytics`);
        let gatewaysCount = await Dispute.findOne({
            where: { createdAt: { [Op.gte]: new Date(startDate) }, businessId, gateway },
            attributes: [
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
            raw: true
        });
        console.timeEnd(`Fetch Business ${gateway} Gateway Dispute Analytics`);

        if (_.isEmpty(gatewaysCount)) {

            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Gateway Analytics Fetched Successfully",
                    {
                        gateway,
                        gatewaysAnalytics: {
                            total: 0,
                            pending: 0,
                            won: 0,
                            lost: 0,
                            winPercentage: 0,
                            lostPercentage: 0,
                            pendingPercentage: 0
                        },
                    },
                    true
                )
            );
        }

        console.log("gateway Disputes : ", gatewaysCount)
        // Format The Payload
        const total = parseInt(gatewaysCount?.totalDisputes);
        const won = parseInt(gatewaysCount?.wonDisputes);
        const lost = parseInt(gatewaysCount?.lostDisputes);
        const pending = total - (won + lost);
        gatewaysCount = {
            total,
            won,
            lost,
            pending,
            wonPercentage: +((won / total) * 100).toFixed(2),
            lostPercentage: +((lost / total) * 100).toFixed(2),
            pendingPercentage: +((pending / total) * 100).toFixed(2),
        }

        // Return the Payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Gateway Dispute Analytics Fetched Successfully",
                { gateway, gatewaysAnalytics: gatewaysCount },
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

// Fetch Specific Gateway Dispute Money Lost Analytics
const getGatewayDisputeMoneyLost = catchAsync(async (req, res) => {
    // @route : GET  /api/v2/merchant/dashboard/:gateway/money-loss
    try {
        // Step 1 : Extract The User Details From Request
        const { userRole, currUser } = req;
        const { gateway } = req.params;
        const range = req.query.range || "6m"; // "1m", "6m", "1y"
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
        // Check is the Valid Gateway
        if (!GatewayNames.includes(gateway?.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('Valid Gateway'));
        }

        // Step 3 : Return payload if no business account linked
        if (_.isEmpty(businessId)) {

            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Fetched Dispute Money Loss Successfully",
                    {
                        totalAmountLost: 0,
                        moneyLost: [],
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
        console.time(`Fetch Business ${gateway} Gateway Dispute Money Loss Analytics`);
        const gatewayData = await Dispute.findAll({
            where: {
                createdAt: { [Op.gte]: startDate },
                businessId,
                gateway
            },
            attributes: [
                [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'month'],
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
            group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'ASC']],
            raw: true
        });

        console.timeEnd(`Fetch Business ${gateway} Gateway Dispute Money Loss Analytics`);

        console.log("dates : ", startDate);


        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Fetched Dispute Financial Loss Successfully",
                { gatewayData },
                true
            )
        );
    } catch (error) {
        console.log("Error in Fetching Merchant Business Gateway Disputes Money Lost : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch Business Gateways Money Lost",
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
    fetchDisputeCommonReasonAnalytics,
    fetchBusinessGatewayDisputesCount,
    fetchBusinessGatewayDisputeAnalytics,
    getGatewayDisputeMoneyLost
};

export default merchantDashboardController;