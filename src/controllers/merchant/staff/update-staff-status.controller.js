/**
 * Controller to update the status of a staff member (ACTIVE/INACTIVE) for a merchant.
 *
 * @function
 * @async
 * @param {import('express').Request} req - Express request object, expects:
 *   - `req.currUser` {Object}: The current authenticated merchant user.
 *   - `req.userRole` {Object}: The roles of the current user, expects `merchant` boolean.
 *   - `req.params.staffId` {string}: The staff ID to update.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Responds with a JSON object indicating success or failure.
 *
 * @throws {AppError} If validation fails at any step (missing user, invalid staffId, unauthorized, etc).
 *
 * @description
 * Steps performed:
 * 1. Extracts current user and role from request.
 * 2. Validates user and role as merchant.
 * 3. Validates and checks staffId format.
 * 4. Fetches staff by staffId and merchantId.
 * 5. Toggles staff status between ACTIVE and INACTIVE.
 * 6. Updates staff status in the database.
 * 7. Returns a success or error response.
 */


import _ from "lodash";
import Staff from "../../../models/staff.model.js";
import AppError from "../../../utils/app-error.util.js";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import catchAsync from "../../../utils/catch-async.util.js";
import { failed_response, success_response } from "../../../utils/response.util.js";
import statusCodes from "../../../constants/status-codes.constant.js";


const updateStaffStatus = catchAsync(async (req, res) => {
  // @desc Updating the Status of the Staff
  try {
    // Step 1 Extract the Details

    //  1.1 Extract the User and UserRole From the Request
    const { currUser, userRole } = req;

    // 1.2 Extracting the StaffId from the params
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

    // Step 7:  Fetching the Staff Which satisfied the StaffId and the Merchant Id
    const staff = await Staff.findOne({
      where: { staffId, merchantId: currUser.userId },
      attributes: ["id", "staffId", "merchantId", "status"],
      raw: true,
    });

    // Step 8: Checking For Staff is Available in the Database
    if (_.isEmpty(staff)) {
      throw new AppError(
        statusCodes.NOT_FOUND,
        AppErrorCode.fieldNotAuthorized("staff")
      );
    }

    // Step 9: Changing the Status of the Staff Based on present Status
    const newStatus = staff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    // step 10: updating the Staff Status

    await Staff.update(
      { status: newStatus },
      { where: { staffId }, fields: ["status"] }
    );

    // Step 11: Returning the Response with the Status Updated with StaffId
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Staff Status Updated",
          { staffId },
          true
        )
      );
  } catch (error) {
    console.log("Error in Changing Staff Status:", error?.message);
    return res
      .status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Failed to Update Status",
          { message: error?.message || "Updating Status Failed!" },
          false
        )
      );
  }
});

export default updateStaffStatus;
