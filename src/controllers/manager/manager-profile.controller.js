/**
 * @function getManagerProfile
 * @description Fetches the profile details of the currently authenticated manager.
 *
 * @route GET /api/v2/manager/profile
 *
 * @param {Object} req - Express request object
 * @param {Object} req.currUser - The currently authenticated user object
 * @param {Object} req.userRole - The roles associated with the current user
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Success response with manager profile details
 * @returns {Object} 400 - Bad request if user is not authorized or missing required fields
 * @returns {Object} 404 - Not found if manager does not exist
 * @returns {Object} 500 - Internal server error if fetching fails
 *
 * @throws {AppError} If the current user or user role is invalid or manager is not found
 *
 * Steps:
 * 1. Extracts the current user and user role from the request.
 * 2. Validates the presence and authorization of the user.
 * 3. Constructs a query to fetch the manager by user ID and role.
 * 4. Retrieves the manager's profile and associated merchant details.
 * 5. Returns the manager profile in the response or throws an error if not found.
 */


import _ from "lodash";
import Manager from "../../models/manager.model.js";
import Merchant from "../../models/merchant.model.js";
import catchAsync from "../../utils/catch-async.util.js";
import AppError from "../../utils/app-error.util.js";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import { success_response, failed_response } from "../../utils/response.util.js";
import statusCodes from "../../constants/status-codes.constant.js";


 // @desc  Fetching The Manager Details For Profile
const getManagerProfile = catchAsync(async (req, res) => {
   // @route    : GET /api/v2/manager/profile
    try {

        // Step 1 : Extracting the CurrUser , UserRole and the BusinessId From the request 
        const { currUser, userRole } = req;

        // Step 2 : Validating the Request for user and the UserRole 
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.UnAuthorizedField("Current User"));
        };

        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        };

        if (!userRole.manager) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        }

        // Step 3 : Creating Where Clause to Fetch the Manager 
        const whereClause = {
            id: currUser?.userId,
            staffRole: userRole?.manager ? "manager" : undefined,
        };

        // Step 4 : Fetching the Manager using WhereClause and fetching required fields and Including the Associated Merchant 
        const manager = await Manager.findOne({
            where: whereClause,
            attributes: ['id', 'staffId', 'firstName', 'lastName', 'email', 'mobileNumber', 'staffRole', 'status', 'createdAt'],
            include: [
                {
                    model: Merchant,
                    as: "merchant",
                    attributes: ['name', "merchantId"]
                }
            ],
            raw: true
        });


        // Step 5 : If manager not Exist throwing the error
        if (_.isEmpty(manager)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound("Manager"));
        }


        // Step 6 : Creating Custom payload to Send the response in detail
        const managerProfile = {
            fullName: `${manager?.firstName} ${manager?.lastName}`,
            email: manager?.email,
            mobileNumber: manager?.mobileNumber,
            joinedOn: manager?.createdAt,
            managerId: manager?.staffId,
            role: manager?.staffRole,
            merchant: `${manager['merchant.name']} (${manager['merchant.merchantId']})`,
            status: manager?.status
        };


        // Step 7 : Returning the response of the manager Parsed from managerProfile Payload
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Manager Profile Fetched Successfully!",
                { managerProfile },
                true
            )
        );

    } catch (error) {
        console.log(error?.message || " Error While Fetching the Manager Profile");
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Fetching Manager Profile Failed",
                { message: error?.message || "Failed to Fetch Manager Profile" },
                false,
            )
        )
    }
})



const managerProfileController = {
    getManagerProfile,
}

export default managerProfileController;