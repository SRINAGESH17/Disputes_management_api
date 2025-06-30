/**
 * Controller to update the status of a staff member (ACTIVE/INACTIVE) for a merchant.
 * 
 * @function
 * @async
 * @param {import('express').Request} req - Express request object, expects `currUser` (merchant) and `staffId` in params.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON response with the updated staff status and total status cards.
 * 
 * @throws {AppError} If merchant is not authorized, staffId is missing/invalid, or staff is not found.
 * 
 * @description
 * Steps performed:
 * 1. Extracts merchant and staffId from the request.
 * 2. Validates merchant and staffId.
 * 3. Fetches the staff record for the given merchant and staffId.
 * 4. Toggles the staff status between ACTIVE and INACTIVE.
 * 5. Updates the staff status and fetches updated status cards within a transaction.
 * 6. Commits the transaction and returns a success response.
 * 7. Rolls back the transaction and returns an error response if any step fails.
 */

import _ from "lodash";
import Staff from "../../../models/staff.model.js";
import staffStatusCards from "./staff-status-cards.controller.js";
import AppError from "../../../utils/app-error.js";
import AppErrorCode from "../../../constants/app-error-codes.js";
import catchAsync from "../../../utils/catch-async.js";
import { failed_response, success_response } from "../../../utils/response.js";
import statusCodes from "../../../constants/status-codes.js";
import sequelize from "../../../config/database.config.js";

const updateStaffStatus = catchAsync(async (req, res) => {
  const t = await sequelize.transaction();
  // @desc Updating the Status of the Staff
  try {
    // Step 1 Exctrat the Details

    // 1.1 Exctacting the Merchant From the Request
    const { currUser } = req;

    // 1.2 Exctrating the StaffId from the params
    const { staffId } = req.params;

    // Step 2 Checking the Merchant is Fetched or Not
    if (_.isEmpty(currUser)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.fieldNotAuthorized("Merchant")
      );
    }

    // Step 3  Validating the Staff Id is sent in Params or Not
    if (_.isEmpty(staffId)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.fieldIsRequired("staffId")
      );
    }

    if (staffId?.length !== 15 && staffId.slice(0, 3) !== "SID") {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.InvalidFieldFormat("staffId")
      );
    }
    // Step 4 Validating the StaffId length and

    // Step 4  Fetching the Staff Which statisfies the StaffId and the Merchant Id
    const staff = await Staff.findOne({
      where: { staffId, merchantId: currUser.userId },
      attributes: ["id", "staffId", "merchantId", "status"],
      raw: true,
    });

    // Step 5 Checking For Staff is Available in the Database
    if (_.isEmpty(staff)) {
      throw new AppError(
        statusCodes.NOT_FOUND,
        AppErrorCode.fieldNotAuthorized("staff")
      );
    }

    // Step 6 Changing the Status of the Staff Based on present Status
    const newStatus = staff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    // step 7 updating the Staff Status and also Fetching the Staff Status cards
    const [, totalStatus] = await Promise.all([
      await Staff.update(
        { status: newStatus },
        { where: { staffId }, transaction: t }
      ),

      await staffStatusCards(req, res, t),
    ]);

    // Step 8 Everything is updated then commiting the Transaction

    await t.commit();

    // Step 9 Returning the Reponse with the Status Upadted with StaffId
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Staff Status Updated",
          { staffId, totalStatus },
          true
        )
      );
  } catch (error) {
    // Step 10 If there is any error while changing the staff status the transaction will be rolled Back
    await t.rollback();
    console.log("Error in Changing Staff Status:", error?.message);
    return (
      res
        .status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR)
        .json(
          failed_response(
            error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR
          )
        ),
      "Failed to Update Status",
      { message: error?.message || "Updating Status Failed!" },
      false
    );
  }
});

export default updateStaffStatus;
