/**
 * @function welcomeDashboard
 * @description Fetches the merchant dashboard welcome details after login.
 *
 * @route GET /api/v2/merchant/dashboard/welcome
 *
 * @param {Object} req - Express request object
 * @param {Object} req.currUser - The currently authenticated user object
 * @param {Object} req.userRole - The roles associated with the current user
 * @param {string} [req.businessId] - Optional business ID to fetch business-specific details
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Success response with merchant dashboard details
 * @returns {Object} 400 - Bad request if user is not authorized or missing required fields
 * @returns {Object} 404 - Not found if merchant does not exist
 * @returns {Object} 500 - Internal server error if fetching fails
 *
 * @throws {AppError} If the current user or user role is invalid or merchant is not found
 *
 * Steps:
 * 1. Extracts the current user, user role, and business ID from the request.
 * 2. Validates the presence and authorization of the user as a merchant.
 * 3. Fetches the merchant details from the database using the user ID.
 * 4. Constructs the merchant dashboard payload including name, customMerchantId, totalStaff, and business info.
 * 5. If a business ID is provided, fetches the payment gateways for the business.
 * 6. Returns the merchant dashboard details in the response or throws an error if not found.
 */


import _ from "lodash";
import catchAsync from "../../../utils/catch-async.util.js";
import { failed_response, success_response } from "../../../utils/response.util.js";
import AppError from "../../../utils/app-error.util.js";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import statusCodes from "../../../constants/status-codes.constant.js";
import Merchant from "../../../models/merchant.model.js";
import Business from "../../../models/business.model.js";

// @desc Fetching MerchantDetails After Login
const welcomeDashboard = catchAsync(async (req, res) => {

  // @route  : GET /api/v2/merchant/dashboard/welcome
  try {
    // Step 1: Extract the User and UserRole From the Request
    const { currUser, userRole, businessId } = req;

    // Step 2: validating the User  is Fetched
    if (_.isEmpty(currUser)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("merchant"));
    }

    // Step 3 : Checking For the UserId
    if (!currUser?.userId) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("merchant"));
    }

    // step 4 : Validating the User is Merchant or Not
    if (!userRole?.merchant) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotAuthorized("merchant"));
    }


    // Step 5 : Creating the Merchant Payload Required for the Dashboard
    const merchantDetails = {
      name: "",
      customMerchantId: "",
      totalStaff: "",
      business: businessId || false,
      businessPaymentGateways: "",
    }

    // Step 6: Fetching the Merchant Details From the Database ;
    const merchant = await Merchant.findOne(
      {
        where: { id: currUser.userId },
        attributes: ["id", "merchantId", "name", "selectedBusinessId", "totalAnalysts", "totalManagers"],
        raw: true
      },
    );

    // step 7: Validating the Merchants Exist or Not From the Database
    if (_.isEmpty(merchant)) {
      throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound("Merchant"));
    };


    // Step 8: Based on the Fetched Details the Data is Attached to the Merchant Details Payload
    merchantDetails.name = merchant?.name;
    merchantDetails.customMerchantId = merchant?.merchantId,
      merchantDetails.totalStaff = (merchant?.totalAnalysts || 0) + (merchant?.totalManagers || 0);

    // Step 9: If there is Business Id then we will fetch the Payment Gateways of the Particular Business
    if (businessId) {
      const businessGateways = await Business.findOne({ where: { id: businessId }, attributes: ['gateways'], raw: true });
      merchantDetails.businessPaymentGateways = businessGateways?.gateways ? true : false;
    };

    // Step 10: Returning the Merchant Details  Payload 
    return res.status(statusCodes.OK).json(
      success_response(
        statusCodes.OK,
        "Welcome Dashboard Fetched Successfully!",
        {
          merchantDetails,
        },
        true
      )
    );
  } catch (error) {
    console.log("Error in Fetching the Merchant Dashboard  Details!: ", error?.message);
    return res
      .status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Failed to Fetch  Welcome Dashboard ",
          { message: error?.message || "Fetching Welcome Dashboard Failed" },
          false
        )
      );
  }
});

export default welcomeDashboard;
