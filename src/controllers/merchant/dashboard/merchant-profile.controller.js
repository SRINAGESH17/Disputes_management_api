/**
 * Controller to fetch the merchant profile for the dashboard.
 *
 * @function
 * @name merchantProfile
 * @async
 * @param {import('express').Request} req - Express request object, expects `currUser` and `userRole` properties.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON response with the merchant profile data or an error message.
 *
 * @throws {AppError} If the current user is not found, userId is missing, or user is not authorized as a merchant.
 *
 * @description
 * Steps performed:
 * 1. Extracts the current user and role from the request.
 * 2. Validates that the user exists and has a userId.
 * 3. Checks if the user has the merchant role.
 * 4. Fetches the merchant profile from the database using the userId.
 * 5. Returns the merchant profile in the response.
 * 6. Handles and logs errors, returning appropriate error responses.
 */


import Merchant from "../../../models/merchant.model.js";
import _ from "lodash";
import catchAsync from "../../../utils/catch-async.util.js";
import AppError from "../../../utils/app-error.util.js";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import { failed_response, success_response } from "../../../utils/response.util.js";
import statusCodes from "../../../constants/status-codes.constant.js";
import Business from "../../../models/business.model.js";
import helpers from "../../../utils/helpers.util.js";

// @desc Fetching the Merchant Dashboard
const merchantProfile = catchAsync(async (req, res) => {

  // @route  :GET /api/v2/merchant/profile
  try {
    // Step 1: Extracting the User and Role From the Request
    const { currUser, userRole, businessId } = req;

    // Step 2: validating the User  is Fetched

    if (_.isEmpty(currUser)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.fieldNotFound("merchant")
      );
    }

    // Step 3 : Checking For the UserId

    if (!currUser?.userId) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.fieldNotFound("merchant")
      );
    }


    // step 3.1 Validating the BusinessId is UUIDV4
    if (currUser?.userId && !helpers.isValidUUIDv4(currUser?.userId)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("userId"));
    }

    // step 4 : Validating the User is Merchant or Not
    if (!userRole.merchant) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.fieldNotAuthorized("merchant")
      );
    }

    // Step 5 : Checking the BusinessId is coming from the request
    if (_.isEmpty(businessId)) {
      return res.status(statusCodes.OK).json(
        success_response(
          statusCodes.OK,
          "Merchant Profile Fetched Successfully!",
          {
            user: currUser?.userId,
            businessId: null,
            businessName: null,
            GSTIN: null,
          },
          true
        )
      )
    }

    // Step 6 : Validating the Incoming businessId is Valid UUIDV4
    if (businessId && !helpers.isValidUUIDv4(businessId)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("businessId"))
    }

    // Step 5: Fetching the Merchant From the Database
    const merchant = await Merchant.findByPk(currUser?.userId, {
      attributes: ["id", "merchantId", "name", "mobileNumber", "email",],
      include: {
        model: Business,
        as: 'businessAccounts',
        attributes: ['id', 'customBusinessId', "gstin", 'businessName', 'createdAt'],
        required: false
      },
      order: [[{ model: Business, as: "businessAccounts" }, "createdAt", "DESC"]]
    });


    // Step 6: Returning the Response with the Fetched Merchant
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Merchant Profile Fetched!",
          { merchant },
          true
        )
      );
  } catch (error) {
    console.log("Error while Fetching Merchant Profile", error?.message);
    return res
      .status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          statusCodes.INTERNAL_SERVER_ERROR,
          "Failed to Fetch Merchant Profile",
          { message: error?.message || "Fetching Merchant Profile Failed!" },
          false
        )
      );
  }
});

export default merchantProfile;
