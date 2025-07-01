/**
 * Controller to fetch and return merchant details for the welcome dashboard after login.
 *
 * @function
 * @name welcomeDashboard
 * @async
 * @param {import('express').Request} req - Express request object, expects `currUser` and `userRole` properties.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON response with merchant details on success, or an error message on failure.
 *
 * @throws {AppError} If the current user or userId is missing, or if the user is not authorized as a merchant, or if the merchant is not found in the database.
 *
 * @description
 * Steps performed:
 * 1. Extracts the current user and user role from the request.
 * 2. Validates that the user and userId exist.
 * 3. Checks if the user has merchant privileges.
 * 4. Fetches merchant details from the database using the userId.
 * 5. Returns the merchant details in the response if found, otherwise throws an error.
 */


import _ from "lodash";
import catchAsync from "../../../utils/catch-async.js";
import { failed_response, success_response } from "../../../utils/response.js";
import AppError from "../../../utils/app-error.js";
import AppErrorCode from "../../../constants/app-error-codes.js";
import statusCodes from "../../../constants/status-codes.js";
import Merchant from "../../../models/merchant.model.js";

const welcomeDashboard = catchAsync(async (req, res) => {
  // @desc Fetching MerchantDetails After Login
  try {
    // Step 1: Extract the User and UserRole From the Request
    const { currUser, userRole } = req;

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

    // step 4 : Validating the User is Merchant or Not
    if (!userRole.merchant) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.fieldNotAuthorized("merchant")
      );
    }

    // Step 5: Fetching the Merchant Details From the Database ;
    const merchant = await Merchant.findOne(
      {
        where: { id: currUser.userId },
        attributes: [
          "id",
          "merchantId",
          "name",
          "email",
          "mobileNumber",
          "gstin",
          "gateways",
          "totalStaff",
          "totalDisputes",
        ],
      },

      { raw: true }
    );

    // step 6: Validating the Merchants Exist or Not From the Database
    if (_.isEmpty(merchant)) {
      throw new AppError(
        statusCodes.NOT_FOUND,
        AppErrorCode.fieldNotFound("Merchant")
      );
    }

    // Step 7: Returning the Merchant Payload
    return res.status(statusCodes.OK).json(
      success_response(
        statusCodes.OK,
        "Welcome Dashboard Fetched Successfully!",
        {
          merchant,
        },
        true
      )
    );
  } catch (error) {
    console.log("Error in Fetching the Merchant Details!: ", error?.message);
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
