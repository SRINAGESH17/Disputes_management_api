
/**
 * Controller to fetch and return status cards for staff under a merchant.
 *
 * @function
 * @name staffStatusCards
 * @async
 * @param {import('express').Request} req - Express request object, expects `currUser` and `userRole` properties.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON response with staff status counts and total staff count.
 *
 * @throws {AppError} If the current user or userId is missing, or if the user is not authorized as a merchant, or if no staff are found.
 *
 * @description
 * Steps performed:
 * 1. Extracts current user and user role from the request.
 * 2. Validates the presence of the user and userId.
 * 3. Checks if the user has merchant privileges.
 * 4. Fetches all staff under the merchant.
 * 5. Calculates the count of active and inactive staff.
 * 6. Returns the counts and total staff as a JSON response.
 * 7. Handles errors and sends appropriate error responses.
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

    // step 5: Finding the Staff Under the Fetched Merchant
    const merchantStaffs = await Staff.findAll({
      where: { merchantId: currUser.userId },
      attributes: ["id", "status"],
      raw: true,
    });

    // step  6: Checking if the Staff Exist or Not
    if (_.isEmpty(merchantStaffs)) {
      throw new AppError(
        statusCodes.NOT_FOUND,
        AppErrorCode.fieldNotFound("staff")
      );
    }

    // Step 7: Finding the Different type of Staff Status Cards
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

    // Step 8: Finding the TotalStaff status Cards
    // const totalStatusStaffCards =
    //   staffStatusCounts.active + staffStatusCounts.inactive;

    // step 8: Returning the staffStatus Cards and the totalCards
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Status Cards Fetched !",
          {
            totalStatusStaffCards: merchantStaffs.length,
            ...staffStatusCounts,
          },
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
