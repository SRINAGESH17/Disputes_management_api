import Manager from "../../../models/manager.model.js";
import Analyst from "../../../models/analyst.model.js";
import { Op } from "sequelize";
import _ from "lodash";
import AppError from "../../../utils/app-error.util.js";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import catchAsync from "../../../utils/catch-async.util.js";
import { success_response, failed_response } from "../../../utils/response.util.js";
import statusCodes from "../../../constants/status-codes.constant.js";
import Dispute from "../../../models/dispute.model.js";
import { GatewayNames } from "../../../constants/gateways.constant.js";
import helpers from "../../../utils/helpers.util.js";

const isValidDate = (dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

/**
 * @module staffController
 * @description Controller for managing merchant staff (Analyst and Manager).
 * Includes operations for fetching all staff, fetching a particular staff, 
 * getting staff status cards, and updating staff status.
 */

/**
   * Fetches all staff (Analyst and Manager) under the current merchant.
   * 
   * Steps:
   * 1. Extracts current user and user role from the request.
   * 2. Checks for a search query parameter.
   * 3. Validates incoming request data:
   *    - Checks if current user exists.
   *    - Checks if userId exists.
   *    - Checks if user has merchant role.
   * 4. Creates a where clause for data retrieval based on merchantId.
   * 5. If a search query is provided, adds dynamic filters for staff fields.
   * 6. Fetches all analysts and managers under the merchant.
   * 7. Combines all staff into a single array.
   * 8. Applies pagination to the staff list.
   * 9. Returns the paginated staff list in the response.
   * 
   * @function getAllStaff
   * @async
   * @param {Object} req - Express request object, expects currUser, userRole, and query params.
   * @param {Object} res - Express response object.
   * @returns {Object} JSON response with paginated staff data.
   */

// @desc Fetching all the Staff
const getAllStaff = catchAsync(async (req, res) => {

    // @route    : GET/api/v2/merchant/staff/all
    try {
        // Step 1 : Extracting the CurrUser and userRole from the Middleware Request
        const { currUser, userRole } = req;

        // Step 2: Checking For Search Operation
        const { search, role } = req.query;



        // Step 3 : Validating the Incoming Request Data

        // Step 3.1 : Validating the CurrentUser Exist or Not 
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("merchant"));
        }

        // Step 3.2 : Checking the UserId from the Request
        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("merchant"));
        }

        // Step 3.3 : Validating the Incoming UserId is UUIDV4 
        if (currUser?.userId && !helpers.isValidUUIDv4(currUser?.userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("UserId"))
        }

        // Step 3.4 : Validating the UserRole Exist or Not 
        if (!userRole.merchant) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotAuthorized("merchant"));
        }


        // Step 4 :Creating WhereClause To Retrieval of Data based on the Condition
        let whereClause = {
            merchantId: currUser?.userId,
        }

        // Step 5 : If a search query parameter is provided, add a dynamic filter to the whereClause.
        // This filter allows searching staff records by matching the search term against multiple fields:
        // staffId, firstName, lastName, email, mobileNumber, and status. It uses case-insensitive
        // matching (iLike/iRegexp) to return results containing or matching the search term in any of these fields.


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

        if (role) {
            whereClause.staffRole = role.toLowerCase();
        }



        // Step 6: Finding the Staff Under the Fetched Merchant
        const [analyst, manager] = await Promise.all([

            // Step 6.1 Fetching All the Analyst Under the Merchant
            Analyst.findAll({
                where: whereClause,
                attributes: ['id', 'staffId', 'firstName', 'lastName', 'staffRole', 'email', 'status'],
                order: [['createdAt', 'ASC']],
                raw: true,

            }),

            // Step 6.2 Fetching All the Manager Under the Merchant
            Manager.findAll({
                where: whereClause,
                attributes: ['id', 'staffId', 'firstName', 'lastName', 'staffRole', 'email', 'status', 'mobileNumber', 'createdAt'],
                order: [['createdAt', 'ASC']],
                raw: true,
            })

        ]);

        // Step 7 :  Storing all the Staff in One variable from above Promise 
        const allStaff = [...manager, ...analyst];

        const totalStaff = allStaff.length;
        // Step 8 : Adding Pagination to the Staff while Fetching
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 25);
        const offset = (page - 1) * limit;


        const paginatedStaff = allStaff.slice(offset, offset + limit);
        const totalPages = Math.ceil(totalStaff / limit);

        // Step 9 : Creating a Custom Payload To send the Response with the Pagination 
        const payload = {
            totalPages,
            totalStaff,
            page,
            limit,
            paginatedStaff
        }

        // Step 10 : Returning the Response based on the Custom Payload
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Staff Fetched Successfully!",
                {
                    payload
                },
                true
            )
        );

    } catch (error) {
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Fetching Staff Details Failed",
                { message: error?.message || "Failed Fetching Staff Details" },
                false
            )
        )
    }
});


/**
   * Fetches a particular staff member's data by staffId.
   * 
   * Steps:
   * 1. Extracts current user and user role from the request.
   * 2. Validates incoming request data:
   *    - Checks if current user exists.
   *    - Checks if userId exists.
   *    - Checks if user has merchant role.
   *    - Checks if staffId is provided and valid.
   * 3. Creates a where clause to find the staff by merchantId and staffId.
   * 4. Determines staff role by staffId prefix and fetches the staff.
   * 5. Returns the staff data in the response.
   * 
   * @function getStaff
   * @async
   * @param {Object} req - Express request object, expects currUser, userRole, and staffId param.
   * @param {Object} res - Express response object.
   * @returns {Object} JSON response with staff data.
   */

// @desc Fetching  Particular Staff Data
const getStaff = catchAsync(async (req, res) => {

    // @route   : GET /api/v2/merchant/staff/:staffId
    try {
        // Step 1 : Extracting the CurrUser and userRole from the Middleware Request
        const { currUser, userRole } = req;

        const { staffId } = req.params;

        // Step 2 : Validating the Incoming Request Data

        // Step 2.1 : Validating the CurrentUser Exist or Not 
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("merchant"));
        };

        // Step 2.2 : Checking the UserId from the Request
        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("merchant"));
        };

        // Step 2.3 : Validating the Incoming User Id is UUIDV4
        if (currUser?.userId & !helpers.isValidUUIDv4(currUser?.userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("UserId"))
        }

        // Step 2.4 : Validating the UserRole Exist or Not 
        if (!userRole.merchant) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotAuthorized("merchant"));
        };

        // Step 2.4 : Validating the Staff Id is Passing in Params or Not
        if (_.isEmpty(staffId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("staffId"));
        };

        // step 2.5 : Validating the StaffId length and Prefix
        if (staffId.slice(0, 3) != "BZA" || staffId.slice(0, 3) != "BZM" && staffId.length != 15) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField("staffId"))
        };

        // Step 3 : Creating the whereClause to Check for the Staff
        const whereClause = {
            merchantId: currUser.userId,
            staffId,
        }

        let staff;
        // Step 4 : Based on the StaffId Prefix Checking for the Role and Fetching the Staff
        if (staffId.slice(0, 3) === "BZA") {
            staff = await Analyst.findOne({
                where: whereClause,
                attributes: ['id', 'staffId', "email", "mobileNumber", "status", "createdAt", "staffRole"],
                raw: true
            })
        } else if (staffId.slice(0, 3) === "BZM") {
            staff = await Manager.findOne({
                where: whereClause,
                attributes: ['id', 'staffId', "email", "mobileNumber", "status", "createdAt", "staffRole"],
                raw: true
            })
        }

        // Step 5 : Throwing Error if there is not any Staff Exist
        if (_.isEmpty(staff)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Staff Fetched Successfully!",
                    { staff: [] },
                    true
                )
            )
        }


        // Step 6 : returning the Staff
        return res.status(statusCodes.OK).json(success_response(
            statusCodes.OK,
            "Staff Fetched Successfully",
            { staff },
            true
        ));



    } catch (error) {
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Failed Fetching Staff Details",
                { message: error?.message || "Fetching Staff Details Failed" },
                false
            )
        )
    }
});

/**
   * Fetches status cards for all staff under the current merchant.
   * 
   * Steps:
   * 1. Extracts current user and user role from the request.
   * 2. Validates incoming request data:
   *    - Checks if current user exists.
   *    - Checks if userId exists.
   *    - Checks if user has merchant role.
   * 3. Creates a where clause to fetch staff by merchantId.
   * 4. Fetches all analysts and managers' statuses.
   * 5. Combines all staff and counts active/inactive staff.
   * 6. Returns total staff and status counts in the response.
   * 
   * @function getStaffStatusCards
   * @async
   * @param {Object} req - Express request object, expects currUser and userRole.
   * @param {Object} res - Express response object.
   * @returns {Object} JSON response with staff status cards.
   */

// @desc   Getting The Staff Status Cards which are Active and InActive
const getStaffStatusCards = catchAsync(async (req, res) => {

    // @route  : GET / api/v2/merchant/staff/status
    try {
        // Step 1 : Extracting the CurrUser and userRole from the Middleware Request
        const { currUser, userRole } = req;


        // Step 2 : Validating the Incoming Request Data

        // Step 2.1 : Validating the CurrentUser Exist or Not 
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("merchant"));
        }

        // Step 2.2 : Checking the UserId from the Request
        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("merchant"));
        }

        // step 2.3 : Validating the Incoming User Id is UUIDV4
        if (currUser?.userId && !helpers.isValidUUIDv4(currUser?.userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("userId"))
        }

        // Step 2.4 : Validating the UserRole Exist or Not 
        if (!userRole.merchant) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotAuthorized("merchant"));
        }

        // Step 3 : Creating where clause to Fetch the Staff Based on merchant Id 
        const whereClause = {
            merchantId: currUser.userId,
        }

        // Step 4 : Fetching all the Staff with the Status
        const [analyst, manager] = await Promise.all([
            Analyst.findAll({ where: whereClause, attributes: ['status'], raw: true }),

            Manager.findAll({ where: whereClause, attributes: ['status'], raw: true })
        ])


        // Step 5 : Spreading the Analyst and Manager into an Array to Find the Status of the Staff
        const allStaff = [...analyst, ...manager];

        // Step 6 : Counting the number of Active and InActive Staff 
        const staffStatusCards = allStaff.reduce((acc, cur) => {
            if (cur.status === 'ACTIVE') {
                acc.active += 1;
            } else {
                acc.inactive += 1;
            }
            return acc;
        }, { active: 0, inactive: 0 })


        // Step 7 : Returning the Total Response of the Staff Status
        return res.status(statusCodes.OK).json(success_response(
            statusCodes.OK,
            "Staff Status Cards Fetched Successfully",
            {
                totalStaff: allStaff.length,
                ...staffStatusCards
            },
            true
        ))

    } catch (error) {
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch Staff Status Cards Details",
                { message: error?.message || "Fetching Staff Status Cards Details Failed" },
                false
            )
        )
    }
})

/**
   * Updates the status (ACTIVE/INACTIVE) of a staff member.
   * 
   * Steps:
   * 1. Extracts current user and user role from the request.
   * 2. Validates incoming request data:
   *    - Checks if current user exists.
   *    - Checks if userId exists.
   *    - Checks if user has merchant role.
   *    - Checks if staffId is provided and valid.
   * 3. Creates a where clause to find the staff by merchantId and staffId.
   * 4. Maps staffId prefix to the appropriate model (Analyst/Manager).
   * 5. Fetches the staff member.
   * 6. Toggles the staff status.
   * 7. Updates the staff status in the database.
   * 8. Returns the staffId in the response.
   * 
   * @function staffStatusUpdate
   * @async
   * @param {Object} req - Express request object, expects currUser, userRole, and staffId param.
   * @param {Object} res - Express response object.
   * @returns {Object} JSON response with updated staffId.
   */


// @desc Updating the Staff Status in Merchant Staff Management 
const staffStatusUpdate = catchAsync(async (req, res) => {

    // @route  : PUT /api/v2/merchant/staff/:staffId
    try {

        // Step 1 : Extracting the CurrUser and userRole from the Middleware Request
        const { currUser, userRole } = req;

        const { staffId } = req.params;

        // Step 2 : Validating the Incoming Request Data

        // Step 2.1 : Validating the CurrentUser Exist or Not 
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("merchant"));
        };

        // Step 2.2 : Checking the UserId from the Request
        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("merchant"));
        };

        // Step 2.3 Validating the Incoming the UserId is UUIDV4
        if (currUser?.userId && !helpers.isValidUUIDv4(currUser?.userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("userId"));
        }
        // Step 2.4 : Validating the UserRole Exist or Not 
        if (!userRole.merchant) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotAuthorized("merchant"));
        };

        // Step 2.5 : Validating the Staff Id is Passing in Params or Not
        if (_.isEmpty(staffId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("staffId"));
        };


        // step 2.6 : Validating the StaffId length and Prefix
        if ((staffId.startsWith("BZA") || staffId.startsWith("BZM")) && staffId.length != 15) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField("staffId"))
        };



        // Step 3 : Creating the whereClause to Check for the Staff
        const whereClause = {
            merchantId: currUser.userId,
            staffId,
        }

        // Step 4 : Creating an Object to Map with the Model using Prefix
        const modelMap = {
            BZA: Analyst,
            BZM: Manager
        }


        // Step 5 : Extracting the Prefix value from the Staff Id and assign the Outcome to the Model 
        const prefix = staffId.slice(0, 3);
        const Model = modelMap[prefix];
        console.log(Model);

        // Step 6 : If Not Both the Model then Throwing the Error
        if (!Model) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField("Staff Id"));
        }


        // Step 7 : Based  on the Model we are Fetching the Staff
        const staff = await Model.findOne({ where: whereClause, attributes: ['status'], raw: true });

        // Step 8 : If Staff Not Found then Throwing the Error
        if (!staff) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound("staff"));
        }

        // step 9 : Changing the Status Based on the Current Status of the Staff
        const newStatus = staff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";



        // Step 10 : Updating the Status using the WhereClause and Selected Field
        await Model.update({ status: newStatus }, { where: whereClause, field: ['status'] });



        //  Step 11: Returning the Response with the StaffId
        return res.status(statusCodes.OK).json(success_response(
            statusCodes.OK,
            "Staff Status Updated Successfully!",
            { staffId },
            true
        ))


    } catch (error) {
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Fetching Staff Details Failed",
                { message: error?.message || "Failed Fetching Staff Details" },
                false
            )
        )
    }
})


const getStaffDisputesData = catchAsync(async (req, res) => {

    try {
        // Step 1 : Extracting the CurrUser and userRole from the Middleware Request
        const { currUser, userRole, businessId } = req;

        // Step 2 : To fetch the Staff Disputes requesting the Staff Id from the Params 
        const { staffId } = req.params;

        // Step 3 : For Search Query to Search with the Custom Dispute Id 
        const { search, gateway, fromDate, toDate } = req.query;

        // Step 4 : Initializing the Pagination Helpers
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 25);
        const offset = (page - 1) * limit;

        // Step 5 : Creating a WhereClause to Separately Fetch the Dispute Based on the Staff 
        let staff;
        let whereClause = {};

        // Step 6 : Validating the Incoming Request Data

        // Step 6.1 : Validating the CurrentUser Exist or Not 
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("merchant"));
        };

        // Step 6.2 : Checking the UserId from the Request
        if (!currUser?.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("merchant"));
        };

        // Step 6.3 : validating the Incoming UserId is UUIDV4
        if (currUser?.userId && !helpers.isValidUUIDv4(currUser?.userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("userId"));
        }

        // Step 6.4 : Validating the UserRole Exist or Not 
        if (!userRole.merchant) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotAuthorized("merchant"));
        };

        // Step 6.5 Returning the Response instead of throwing if there is not any business Id Attached
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                statusCodes.OK,
                "Staff Disputes Fetched Successfully!",
                {
                    totalPages: 0,
                    page: 0,
                    limit: 10,
                    totalDisputes: 0,
                    disputes: [],
                },
                true
            )
        }

        // 6.6 Validating the Incoming businessId is UUIDV4
        if (businessId && !helpers.isValidUUIDv4(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("businessId"));
        }

        // Step 7 : Validating the From and To Date If Passed In the query
        if (fromDate && !isValidDate(fromDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date!"));
        }

        if (toDate && !isValidDate(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date!"));
        }

        if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("From Date", "To Date"));
        }

        //Step 8 : Validating the Gateway is Exist or not In our Application gateways 
        if (gateway) {
            if (!GatewayNames.includes(gateway.toLowerCase())) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField("Gateway"));
            }
        }


        // Step 9 : Validating the Staff Id is Passing in Params or Not
        if (_.isEmpty(staffId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("staffId"));
        };


        // step 9.2 : Validating the StaffId length and Prefix
        if ((staffId.slice(0, 3) != "BZA" || staffId.slice(0, 3) != "BZM") && staffId.length != 15) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField("staffId"))
        };

        // Step 10 : Based on the Prefix of the Staff ID Searching for the Staff in Analyst and Manager
        if (staffId.slice(0, 3) === "BZA") {
            staff = await Analyst.findOne({ where: { staffId }, attributes: ['id'], raw: true })

            whereClause.analystId = staff.id;
            whereClause.workflowStage = {
                [Op.in]: ["SUBMITTED", "REJECTED", "RESUBMITTED", "ACCEPTED", "PENDING"]
            }
        } else if (staffId.slice(0, 3) === "BZM") {
            staff = await Manager.findOne({ where: { staffId }, attributes: ['id'], raw: true });

            whereClause.managerId = staff.id;
            whereClause.workflowStage = {
                [Op.in]: ["ACCEPTED", "REJECTED"]
            }
        };

        // Step 11 : If any Search Attaching that search with the WhereClause to retrieve the Dispute 
        if (search) {
            whereClause.customId = {
                [Op.iLike]: `%${search}%`
            }
        }

        if (fromDate && toDate) {
            whereClause.updatedStageAt = {
                [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
            };
        } else if (fromDate) {
            whereClause.updatedStageAt = {
                [Op.gte]: new Date(fromDate)
            };
        } else if (toDate) {
            whereClause.updatedStageAt = {
                [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
            };
        }


        if (gateway) {
            whereClause[Op.or] = [
                ...(whereClause[Op.or] || []),
                { gateway: { [Op.iLike]: `%${gateway}%` } },
            ];
        }

        // Step 12 : Fetching an Counting the TotalDisputes and Disputes Details
        const { count: totalDisputes, rows: staffDisputes } = await Dispute.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'customId', "disputeId", "paymentId", "gateway", "reason", "state", "workflowStage", "amount"],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']],
            raw: true
        });

        const totalPages = Math.ceil(totalDisputes / limit);

        // Step 13 : creating a custom payload to send in the response 
        const payload = {
            totalPages,
            totalDisputes,
            page,
            limit,
            staffDisputes
        }

        // Step 14 : returning the Response with the Custom payload 
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Staff Disputes Fetched Successfully!",
                {
                    payload
                },
                true
            )
        )

    } catch (error) {
        console.log(error?.message || "Error while Fetching Get Staff Disputes Data");
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch the Staff Disputes Data",
                { message: error?.message || "Fetching of Staff Disputes Data Failed" },
                false,
            )
        )
    }
})


const staffController = { getAllStaff, getStaff, getStaffStatusCards, staffStatusUpdate, getStaffDisputesData };

export default staffController;