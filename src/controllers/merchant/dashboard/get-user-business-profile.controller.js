/**
 * @function getUserBusinessProfile
 * @description Fetches the business profile details of the currently authenticated user (Merchant, Analyst, or Manager).
 *
 * @route GET /auth/user/business-profile
 *
 * @param {Object} req - Express request object
 * @param {Object} req.currUser - The currently authenticated user object containing userId
 * @param {Object} req.userRole - The role information of the current user containing userRef
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Success response with user business profile details
 * @returns {Object} 400 - Bad request if user is not authorized or missing required fields
 * @returns {Object} 404 - Not found if user does not exist
 * @returns {Object} 500 - Internal server error if fetching fails
 *
 * @throws {AppError} If the current user or user role is invalid or user is not found
 *
 * Steps:
 * 1. Extracts the current userId and userRole from the request.
 * 2. Validates the presence and authorization of the user and role.
 * 3. Checks if the userRole is one of MERCHANT, ANALYST, or MANAGER.
 * 4. Fetches the user details from the corresponding model based on the role.
 * 5. If the user has an active business, fetches the business details.
 * 6. Returns the user business profile in the response or throws an error if not found.
 */

import _ from "lodash";
import Manager from "../../../models/manager.model.js";
import Analyst from "../../../models/analyst.model.js";
import Merchant from "../../../models/merchant.model.js";
import AppError from "../../../utils/app-error.util.js";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import statusCodes from "../../../constants/status-codes.constant.js";
import catchAsync from "../../../utils/catch-async.util.js";
import { failed_response, success_response } from "../../../utils/response.util.js";
import Business from "../../../models/business.model.js";
import helpers from "../../../utils/helpers.util.js";

// @desc Fetching User Business Profile
const getUserBusinessProfile = catchAsync(async (req, res) => {
    // @route  : GET /auth/user/business-profile

    try {

        // Step 1 : Extracting the userId and the userRole from the request 
        const userId = req.currUser.userId;
        const userRole = req.userRole.userRef;


        // Step 2 : validating the Incoming Request

        // Step 2.1 : validating the UserId exist or not in the Request
        if (_.isEmpty(userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized("userId"));
        }

        if (userId && !helpers.isValidUUIDv4(userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("userId "))
        }
        // Step 2.2 : Validating the UserRole Reference is Exist or not in the request 
        if (_.isEmpty(userRole)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotExist("userRole"));
        }


        // Step 2.3 : Validating the Roles from the Request of UserRole 
        if (userRole != "MERCHANT" && userRole != "ANALYST" && userRole != "MANAGER") {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("userRole"))
        }

        // Step 3 : Based on the Role Fetching the Individual user 
        let user;
        if (userRole === "MERCHANT") {
            user = await Merchant.findByPk(userId, { attributes: ['id', "name", "selectedBusinessId", "merchantId"], raw: true })
        } else if (userRole === "ANALYST") {
            user = await Analyst.findByPk(userId, { attributes: ['id', "firstName", "lastName", "selectedBusinessId", "status", "staffId"], raw: true })

        } else if (userRole === "MANAGER") {
            user = await Manager.findByPk(userId, { attributes: ['id', "firstName", "lastName", "selectedBusinessId", "status", "staffId"], raw: true })

        }

        // Step 4: IF No User Found Throwing the Error
        if (!user) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound("user"));
        };
        user = {
            name: user?.name ? user?.name : `${user?.firstName} ${user?.lastName}`,
            role: userRole,
            customUserId: userRole === 'MERCHANT' ? user?.merchantId : user?.staffId,
            status: userRole === 'MERCHANT' ? 'ACTIVE' : user?.status,
            businessId: user?.selectedBusinessId,
            customBusinessId: '',
            businessName: ""
        }

        // Step 5 : If the user Active Business not equals to null then Fetching the Business Details 
        let business;
        if (user.businessId != null) {
            business = await Business.findOne({ where: { id: user.businessId }, attributes: ['id', 'customBusinessId', 'businessName'], raw: true });
            user.customBusinessId = business?.customBusinessId;
            user.businessName = business?.businessName;
        }



        // Step 6 : Returning the user Business profile Response
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetched User Business Profile",
                { user },
                true
            )
        );

    } catch (error) {
        console.log("Error in Fetching the User Business Profile !: ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Fetching User Business profile Failed",
                { message: error?.message || "Failed Fetching User Business Profile" },
                false,
            )
        )
    }
})


export default getUserBusinessProfile;