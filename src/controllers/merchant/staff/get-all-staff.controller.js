/**
 * Controller to fetch all staff members for a merchant.
 *
 * @function
 * @async
 * @param {import('express').Request} req - Express request object, expects `currUser` and `userRole` on the request, and optional `search`, `page`, and `limit` query parameters.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON response with the list of staff or an error message.
 *
 * @throws {AppError} If the current user or userId is missing, or if the user is not authorized as a merchant.
 *
 * @description
 * - Validates the current user and their role.
 * - Supports searching staff by staffId, firstName, email, mobileNumber, or status.
 * - Supports pagination with `page` and `limit` query parameters (max limit: 25).
 * - Returns a JSON response with the total number of staff and the staff data.
 */

import _ from "lodash";
import Staff from "../../../models/staff.model.js";
import { Op } from "sequelize";
import catchAsync from "../../../utils/catch-async.js";
import { success_response, failed_response } from "../../../utils/response.js";
import AppError from "../../../utils/app-error.js";
import AppErrorCode from "../../../constants/app-error-codes.js";
import statusCodes from "../../../constants/status-codes.js";

const getAllStaff = catchAsync(async (req, res) => {
  //  @desc  Fetching all the Staff
  try {
    // Step 1. Extract the User and UserRole From the Request
    const { currUser, userRole } = req;

    // Step 2 Checking For Any Search QueryParams
    const { search } = req.query;

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

    // Step 5: Creating a whereClause to Use for the Filtering and Findind the Staff
    let whereClause = {
      merchantId: currUser?.userId,
    };

    // Step 6: If there is any Search and based on the whereClause we will fetch the Matching Staff
    if (search) {
      whereClause[Op.or] = [
        { staffId: { [Op.iRegexp]: search } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { mobileNumber: { [Op.iRegexp]: search } },
        { staffId: { [Op.iLike]: `%${search}%` } },
        { status: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 25);

    const offset = (page - 1) * limit;

    // Step 7: Finding all the Staff if there is no search
    const staff = await Staff.findAll({
      where: whereClause,
      attributes: [
        "id",
        "staffId",
        "merchantId",
        "email",
        "firstName",
        "lastName",
        "mobileNumber",
        "status",
      ],
      limit,
      offset,
      order: [["createdAt", "ASC"]],
      raw: true,
    });

    // Step 8 : Returning the Response based on the Search and without Search
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Fetching Staff Successfull!",
          { totalStaff: staff.length, staff },
          true
        )
      );
  } catch (error) {
    return res
      .status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          statusCodes.INTERNAL_SERVER_ERROR,
          "Error Fetching in Staff",
          { message: error?.message || "fetching Staff Failed" },
          false
        )
      );
  }
});

export default getAllStaff;
