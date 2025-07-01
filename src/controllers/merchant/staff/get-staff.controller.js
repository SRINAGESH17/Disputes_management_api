/**
 * Controller to fetch a staff member's details for a merchant.
 *
 * @function
 * @name getStaff
 * @async
 * @param {import('express').Request} req - Express request object, expects `currUser` and `userRole` on the request, and `staffId` in params.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON response with staff details if successful, or an error message if failed.
 *
 * @throws {AppError} Throws error if required fields are missing, user is not authorized, or staffId is invalid.
 *
 * @description
 * Steps performed:
 * 1. Extracts current user and user role from the request.
 * 2. Validates presence and correctness of user and staffId.
 * 3. Checks if the user has merchant privileges.
 * 4. Validates the format of the staffId.
 * 5. Fetches the staff member associated with the merchant.
 * 6. Returns the staff details in the response.
 */

import _ from "lodash";
import Staff from "../../../models/staff.model.js";
import AppError from "../../../utils/app-error.js";
import AppErrorCode from "../../../constants/app-error-codes.js";
import catchAsync from "../../../utils/catch-async.js";
import { failed_response, success_response } from "../../../utils/response.js";
import statusCodes from "../../../constants/status-codes.js";

const getStaff = catchAsync(async (req, res) => {
  // @desc Fetching  the Staff
  try {
    // Step 1 Exctrat the Details

    //  1.1 Extract the User and UserRole From the Request
    const { currUser, userRole } = req;

    // 1.2 Exctrating the StaffId from the params
    const { staffId } = req.params;

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

    // Step 5:  Validating the Staff Id is sent in Params or Not
    if (_.isEmpty(staffId)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.fieldIsRequired("staffId")
      );
    }

    // Step 6 : Validating the StaffId length and it Prefix starts with SID
    if (staffId?.length !== 15 && staffId.slice(0, 3) !== "SID") {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.InvalidFieldFormat("staffId")
      );
    }

    // Step 7:  Fetching the Staff Which statisfies the StaffId and the Merchant Id
    const staff = await Staff.findOne({
      where: { staffId, merchantId: currUser.userId },
      attributes: { exclude: ["id", "firebaseId", "createdAt", "updatedAt"] },
      raw: true,
    });

    // step 8: Returing the Response with the Staff Details
    return res
      .status(statusCodes.OK)
      .json(
        success_response(statusCodes.OK, "Staff is Fetched", { staff }, true)
      );
  } catch (error) {
    console.log("Failed to Fetch the User", error?.message);
    return res
      .status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Failed to Fetch the Staff",
          { message: error?.message || "Fetching Staff Failed" },
          false
        )
      );
  }
});

export default getStaff;
