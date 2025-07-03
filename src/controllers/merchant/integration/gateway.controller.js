import _ from "lodash";
import statusCodes from "../../../constants/status-codes.js";
import catchAsync from "../../../utils/catch-async.js";
import { failed_response, success_response } from "../../../utils/response.js";
import { GatewayNames } from "../../../constants/gateways.js";
import AppError from "../../../utils/app-error.js";
import AppErrorCode from "../../../constants/app-error-codes.js";
import Merchant from "../../../models/merchant.model.js";

// Controller to add a new gateway for the merchant
const addGateway = catchAsync(async (req, res) => {
  // step-1 Destructuring currUser and userRole from request
  const { currUser, userRole } = req;
  const { gatewayName } = req.body;
  try {
    // step-2 Validate currUser and userRole are authorization
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

    // step-4 checking if the gatewayName includes in GatewayNames
      const isExistingGateway = GatewayNames.includes(gatewayName?.toLowerCase());

    // step-5 if gateway name exists in GatewayNames throwing
    if (!isExistingGateway) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.InvalidFieldFormat(gatewayName)
      );
      }

    // step-6 Check if the gateway already exists for the merchant
    const existingMerchantGateway = await Merchant.findOne({
      where: { id: currUser.userId },
      attributes: ["id", "gateways"],
      raw: true,
    });
      const gatewayArray = existingMerchantGateway.gateways;
      
    // step-7 checking if the gatewayName includes from merchant gateways
    if (gatewayArray.includes(gatewayName?.toLowerCase())) {
        throw new AppError(
            statusCodes.BAD_REQUEST,
            `${gatewayName} Gateway is Already Added`
        );
      }

    // step-8 pushing new gateway name into merchant gateway's array
    gatewayArray.push(gatewayName);

    // step-9 Save the updated gateways array to the merchant
    await Merchant.update(
      { gateways: gatewayArray },
        { where: { id: currUser.userId } }
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

// Controller to fetch all available gateways
const fetchGateways = catchAsync(async (req, res) => {
  // step-1 Destructuring currUser and userRole from request
  const { currUser, userRole } = req;

  try {
    // step-2 Validate currUser and userRole are authorization
    if (!currUser && !userRole.merchant) {
      throw new AppError(
        statusCodes.UNAUTHORIZED,
        AppErrorCode.YouAreNotAuthorized
      );
    }

    // step-3 Check if the gateway already exists for the merchant
    const existingMerchantGateway = await Merchant.findOne({
      where: { id: currUser.userId },
      attributes: ["id", "gateways"],
      raw: true,
    });
      

    // step-4 throwing an error if gateways not found in merchants
    if (_.isEmpty(existingMerchantGateway.gateways)) {
      throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.NoGatewaysFound);
    }

    const merchantGateways = existingMerchantGateway.gateways;

    // step-5 sending success response
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Gateways fetched successfully",
            {
                platformGateways: GatewayNames,
                merchantGateways,
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

const gatewayController = { addGateway, fetchGateways };

export default gatewayController;
