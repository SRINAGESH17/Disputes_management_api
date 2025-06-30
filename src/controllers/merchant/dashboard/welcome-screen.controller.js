/**
 * Controller to fetch and return merchant details for the welcome dashboard after login.
 *
 * @function
 * @name welcomeDashboard
 * @async
 * @param {import('express').Request} req - Express request object, expects `currUser` property containing the current user info.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON response with merchant details on success, or an error message on failure.
 *
 * @throws {AppError} If the current user is not authorized or merchant is not found.
 *
 * @description
 * Steps performed:
 * 1. Extracts the current user from the request.
 * 2. Validates the presence of the user.
 * 3. Fetches merchant details from the database using the user's ID.
 * 4. Validates the existence of the merchant.
 * 5. Returns the merchant details in the response.
 * 6. Handles and logs errors, returning appropriate error responses.
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
    // Step 1. Extract the User From the Request
    const { currUser } = req;

    // Step 2 : Validate the User if Fetched or Not

    if (_.isEmpty(currUser)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.fieldNotAuthorized("Merchant")
      );
    }

    // Step 3: Fetching the Merchant Details From the Database ;
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

    // step 4 : Validating the Merchants Exist or Not From the Database
    if (_.isEmpty(merchant)) {
      throw new AppError(
        statusCodes.NOT_FOUND,
        AppErrorCode.fieldNotFound("Merchant")
      );
    }

    // Step 5: Returning the Merchant Payload
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
