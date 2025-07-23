import _ from "lodash";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import statusCodes from "../../../constants/status-codes.constant.js"
import AppError from "../../../utils/app-error.util.js";
import catchAsync from "../../../utils/catch-async.util.js";
import { failed_response, success_response } from "../../../utils/response.util.js"
import Business from "../../../models/business.model.js";
import { GatewayNames } from "../../../constants/gateways.constant.js";
import Dispute from "../../../models/dispute.model.js";
import helpers from "../../../utils/helpers.util.js";
import sequelize from "../../../config/database.config.js";


const value = +((3 / 7) * 100).toFixed(2);
console.log("test : ", value)

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
            const gateways = GatewayNames?.map((gateway) => ({ gateway, totalDisputes: 0 }));

            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Gateway Disputes Count Fetched Successfully",
                    {
                        gateways
                    },
                    true
                )
            );
        }

        // Step 4 : validate businessId is UUIDv4
        if (!helpers.isValidUUIDv4(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('BusinessId'));
        }

        // Step 5 : Fetch the Business Account For Gateways 
        const businessAccount = await Business.findByPk(businessId, { attributes: ['id', 'gateways'], raw: true });
        if (_.isEmpty(businessAccount)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Business Account'));
        }
        console.log("business Account : ", businessAccount);
        const gateways = businessAccount?.gateways || [];

        // Step 6: If No Gateways Added Then return payload
        if (gateways.length == 0) {
            const gateways = GatewayNames?.map((gateway) => ({ gateway, totalDisputes: 0 }));
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Gateway Disputes Count Fetched Successfully",
                    {
                        gateways
                    },
                    true
                )
            );
        }

        // Step 7: Fetch the Business gateway Dispute Counts
        let gatewaysCount = await Dispute.findAll({
            where: { businessId },
            attributes: [
                'gateway',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalDisputes'],
            ],
            group: ['gateway'],
            raw: true
        });

        // Format The Payload
        gatewaysCount = gatewaysCount?.map((gateway) => ({ gateway: gateway?.gateway, totalDisputes: +gateway?.totalDisputes }))


        let disputeStats = await Dispute.findAll({
            where: { businessId },
            attributes: [
                'state',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalDisputes']
            ],
            group: ['state'],
            raw: true
        });
        let totalWonDisputes = 0;
        let totalDisputes = 0;

        disputeStats?.forEach((stat) => {
            if (stat?.state?.toLowerCase() === "won") {
                totalWonDisputes += parseInt(stat?.totalDisputes);
            }
            totalDisputes += parseInt(stat?.totalDisputes);
        });

        const resolutionRate = +((totalWonDisputes / totalDisputes) * 100).toFixed(2);


        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Gateway Disputes Count Fetched Successfully",
                { totalDisputes, resolutionRate, gateways: gatewaysCount, },
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

const merchantDashboardController = {
    totalGatewayDisputes
};

export default merchantDashboardController;