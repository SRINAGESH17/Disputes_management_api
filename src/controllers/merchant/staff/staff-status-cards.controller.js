/**
 * Controller to fetch status cards for staff under a merchant.
 *
 * @function
 * @async
 * @param {import('express').Request} req - Express request object, expects `currUser` property containing merchant info.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON response with staff status card counts (active, inactive, total).
 *
 * @throws {AppError} If the merchant is not authorized or staff not found.
 *
 * @description
 * Steps performed:
 * 1. Extracts the current merchant user from the request.
 * 2. Validates merchant existence.
 * 3. Fetches all staff for the merchant.
 * 4. Validates staff existence.
 * 5. Counts staff by status ("ACTIVE" and others as "inactive").
 * 6. Calculates total staff.
 * 7. Returns the counts in a success response.
 * 8. Handles and returns errors in a failed response.
 */

import _ from "lodash";
import Staff from "../../../models/staff.model.js";
import AppError from "../../../utils/app-error.js";
import AppErrorCode from "../../../constants/app-error-codes.js";
import { success_response, failed_response } from "../../../utils/response.js";
import statusCodes from "../../../constants/status-codes.js";
import catchAsync from "../../../utils/catch-async.js";

const staffStatusCards = catchAsync(async (req, res) => {
  // @desc Checking the Different types of status cards

  try {
    // Step 1 Exctracting the Merchant From the Request
    const { currUser } = req;

    // Step 2 Checking the Merchant exist or not From the Request
    if (_.isEmpty(currUser)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.fieldNotAuthorized("merchant")
      );
    }

    // step 3 Finding the Staff Under the Fetched Merchant
    const merchantStaffs = await Staff.findAll({
      where: { merchantId: currUser.userId },
      attributes: ["id", "status"],
      raw: true,
    });

    // step 4 Checking if the Staff Exist or Not
    if (_.isEmpty(merchantStaffs)) {
      throw new AppError(
        statusCodes.NOT_FOUND,
        AppErrorCode.fieldNotFound("staff")
      );
    }

    // Step 5 Finding the Different type of Staff Status Cards
    const staffStatusCounts = merchantStaffs.reduce(
      (counts, user) => {
        if (user.status === "ACTIVE") {
          counts.active += 1;
        } else {
          counts.inactive += 1;
        }
        return counts;
      },
      { active: 0, inactive: 0 }
    );

    // Step 6 Finding the TotalStaff status Cards
    const totalStatusStaffCards =
      staffStatusCounts.active + staffStatusCounts.inactive;

    // step 7 Returning the staffStatus Cards and the totalCards
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Status Cards Fetched !",
          { totalStatusStaffCards, ...staffStatusCounts },
          true
        )
      );
  } catch (error) {
    return res
      .status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          statusCodes.INTERNAL_SERVER_ERROR,
          "Fetching Staff Cards Failed",
          { message: error?.message || "Failed Fetching Staff Cards" },
          false
        )
      );
  }
});

export default staffStatusCards;
