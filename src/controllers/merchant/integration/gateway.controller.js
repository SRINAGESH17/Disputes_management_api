import _ from "lodash";
import statusCodes from "../../../constants/status-codes.constant.js";
import catchAsync from "../../../utils/catch-async.util.js";
import { failed_response, success_response } from "../../../utils/response.util.js";
import { GatewayNames } from "../../../constants/gateways.constant.js";
import AppError from "../../../utils/app-error.util.js";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import DisputeLog from "../../../models/dispute-log.model.js";
import Business from "../../../models/business.model.js";

// @desc 1. Controller to add a new gateway for the business
const addGateway = catchAsync(async (req, res) => {
  // @route POST /api/v2/merchant/integration/gateway
  try {
     // step-1 Destructuring currUser and userRole from request
  const { currUser, userRole, businessId } = req;
  const { gatewayName } = req.body;
    // step-2 Validate merchant selected active business account
    if (!businessId) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.validFieldIsRequired('Business account')
      );
    }
    // Validate currUser and userRole are authorization
    if (!currUser && !userRole?.merchant) {
      throw new AppError(
        statusCodes.UNAUTHORIZED,
        AppErrorCode.YouAreNotAuthorized
      );
    }

    // step-3 Validate the gateway name
    if (!gatewayName || typeof gatewayName !== "string") {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.validFieldIsRequired("Gateway name")
      );
    }

    // step-4 checking if the gatewayName includes in our GatewayNames
    const isExistingGateway = GatewayNames.includes(gatewayName?.toLowerCase());

    // step-5 if gateway name exists in GatewayNames throwing error
    if (!isExistingGateway) {
      throw new AppError(
        statusCodes.NOT_FOUND,
        AppErrorCode.UnAuthorizedField(`gateway ${gatewayName} is exists in our platform`)
      );
    }

    // step-6 Check if the gateway already exists in our business
    const businessGateway = await Business.findOne({
      where: { id: businessId },
      attributes: ["id", "business_name", "gateways"],
      raw: true,
    });

    if (_.isEmpty(businessGateway)) {
      throw new AppError(
        statusCodes.NOT_FOUND,
        AppErrorCode.fieldNotFound(businessGateway.business_name)
      );
    }

    const existingBusinessGateways = businessGateway?.gateways || [];

    // step-7 checking if the gatewayName includes from business gateways
    if (existingBusinessGateways.includes(gatewayName?.toLowerCase())) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        `${gatewayName} gateway is already exists`
      );
    }

    // step-8 pushing new gateway name into business gateway's array
    existingBusinessGateways.push(gatewayName);

    // step-9 Save the updated gateways array to the business
    await Business.update(
      { gateways: existingBusinessGateways },
      { where: { id: businessId } },
    );

    // step-10 sending success response
    return res
      .status(statusCodes.CREATED)
      .json(
        success_response(
          statusCodes.CREATED,
          "Gateway added successfully",
          { gatewayName },
          true
        )
      );
  } catch (error) {
    // step-11 sending error response
    console.error("Error adding gateways:", error);
    return res
      .status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Failed to add gateway name",
          { message: error.message || "An unexpected error occurred" },
          false
        )
      );
  }
});

// @desc 2. Controller to fetch all available gateways
const fetchGateways = catchAsync(async (req, res) => {
  // @route GET /api/v2/merchant/integration/gateway

   try {
  // step-1 Destructuring currUser and userRole from request
  const { currUser, userRole, businessId } = req;

    // step-2 Validate merchant selected active business account
    if (!businessId) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.validFieldIsRequired('Business account')
      );
    }

    //  Validate currUser and userRole are authorization
    if (!currUser && !userRole.merchant) {
      throw new AppError(
        statusCodes.UNAUTHORIZED,
        AppErrorCode.YouAreNotAuthorized
      );
    }

    // step-3 Check if the gateway already exists in our business
    const business = await Business.findOne({
      where: { id: businessId },
      attributes: ["id", "business_name", "gateways"],
      raw: true,
    });
   

    // step-4 throwing an error if gateways not found in business
    if (_.isEmpty(business.gateways)) {
      throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.NoGatewaysFound);
    }

    // step-5 sending success response
    return res.status(statusCodes.OK).json(
      success_response(
        statusCodes.OK,
        "Gateways fetched successfully",
        {
          platformGateways: GatewayNames,
          business,
        },
        true
      )
    );
  } catch (error) {
    // step-6 sending error response
    console.error("Error fetching gateways:", error);
    return res
      .status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Failed to fetch gateways",
          { message: error.message || "An unexpected error occurred" },
          false
        )
      );
  }
});

// @desc 3. Controller to fetch all dispute logs
const fetchDisputeLogs = catchAsync(async (req, res) => {
  // @route GET /api/v2/merchant/integration/logs
    try {
  // step-1 Destructuring currUser and userRole from request
  const { currUser, userRole, businessId } = req;
      const { gateway } = req.query
      
    // step-2 Validate merchant selected active business account
    if (!businessId) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.validFieldIsRequired('Business account')
      );
    }

    // Validate currUser and userRole are authorization
    if (!currUser && !userRole.merchant) {
      throw new AppError(
        statusCodes.UNAUTHORIZED,
        AppErrorCode.YouAreNotAuthorized
      );
    }

    // step-3 Where condition payload
    const whereCondition = {
      businessId: businessId
    };

    // step-4 Gateway Query parameter found then adding to where condition
    if (gateway) {
      whereCondition.gateway = gateway.toLowerCase();
    }

    // Pagination variables
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // step-5 fetching all dispute logs with pagination, count, and sorting (latest first)
    const { count: totalLogs, rows: disputeLogs, } = await DisputeLog.findAndCountAll({
      where: whereCondition,
      attributes: [
        "id",
        "createdAt",
        "gateway",
        "eventType",
        "disputeId",
        "paymentId",
        "statusUpdatedAt",
        "dueDate",
        "status",
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
      raw: true,
    });

    const totalPages = Math.ceil(totalLogs / limit);    


    // step-6 sending success response
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Dispute logs fetched successfully",
           {
            totalLogs,
            totalPages,
            page,
            limit,
            logs: disputeLogs,
          },
          true
        )
      );
  } catch (error) {
    // step-7 sending error response
    console.error("Error fetching dispute logs:", error);
    return res
      .status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Failed to fetch dispute logs",
          { message: error.message || "An unexpected error occurred" },
          false
        )
      );
  }
});

const gatewayController = { addGateway, fetchGateways, fetchDisputeLogs };

export default gatewayController;
