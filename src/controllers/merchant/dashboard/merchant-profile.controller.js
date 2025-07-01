import Merchant from "../../../models/merchant.model.js";
import _ from "lodash";
import catchAsync from "../../../utils/catch-async.js";
import AppError from "../../../utils/app-error.js";
import AppErrorCode from "../../../constants/app-error-codes.js";
import { failed_response, success_response } from "../../../utils/response.js";
import statusCodes from "../../../constants/status-codes.js";

const merchantProfile = catchAsync(async (req, res) => {
  // @desc Fetching the Merchant Dashboard
  try {
    // Step 1: Exctracting the User and Role From the Request

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

    // Step 5: Fetching the Merchant From the Database
    const merchant = await Merchant.findByPk(currUser?.userId, {
      attributes: ["merchantId", "name", "mobileNumber", "email", "gstin"],
      raw: true,
    });

    // Step 6: Returning the Response with the Fetched Merchant
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Merchant Profile Fetched!",
          { ...merchant },
          true
        )
      );
  } catch (error) {
    console.log("Error while Fetching Merchant Dashboard", error?.message);
    return res
      .status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          statusCodes.INTERNAL_SERVER_ERROR,
          "Failed to Fetch Merchant Profile",
          { message: error?.message || "Fetching Merchant Dashboard Failed!" },
          false
        )
      );
  }
});

export default merchantProfile;
