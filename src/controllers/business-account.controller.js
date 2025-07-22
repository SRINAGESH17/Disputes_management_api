import _ from "lodash";
import statusCodes from "../constants/status-codes.constant.js";
import catchAsync from "../utils/catch-async.util.js";
import { failed_response, success_response } from "../utils/response.util.js";
import AppError from "../utils/app-error.util.js";
import AppErrorCode from "../constants/app-error-codes.constant.js";
import Analyst from "../models/analyst.model.js";
import helpers from "../utils/helpers.util.js";
import Business from "../models/business.model.js";
import Manager from "../models/manager.model.js";
import Merchant from "../models/merchant.model.js";
import StaffBusinessMap from "../models/staff-business-map.model.js";





// @desc : Fetch User Logged Business Accounts
const fetchUserBusinessAccountsAccess = catchAsync(async (req, res) => {
    // @route    : GET  /api/v2/businesses/mine
    try {
        // Extract the User Details From Request
        const { userRole, currUser } = req;


        // Validate the Requested User Details
        if (_.isEmpty(userRole?.userId)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField("User"));
        }
        if (_.isEmpty(currUser?.uid)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField("User"));
        }
        // Generate Business Accounts Payload based on the User
        let merchantId = userRole?.userId;
        if (userRole?.userRef === 'ANALYST') {
            const analyst = await Analyst.findByPk(userRole?.userId, { attributes: ['id', 'merchantId'], raw: true });
            if (_.isEmpty(analyst)) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Analyst'));
            }
            merchantId = analyst?.merchantId;
        }
        if (userRole?.userRef === 'MANAGER') {
            const analyst = await Manager.findByPk(userRole?.userId, { attributes: ['id', 'merchantId'], raw: true });
            if (_.isEmpty(analyst)) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Analyst'));
            }
            merchantId = analyst?.merchantId;
        }

        if (!helpers.isValidUUIDv4(merchantId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('Merchant Id'));
        }

        // Fetch Business Accounts

        let businesses = await Business.findAll({
            where: { merchantId: merchantId },
            attributes: ['id', 'customBusinessId', 'gstin', 'businessName'],
            raw: true
        });

        // Format The Business Accounts Payload
        businesses = businesses?.map((business) => {
            return {
                id: business?.id,
                businessName: business?.businessName,
                customBusinessId: business?.customBusinessId,
                gstin: business?.gstin,
                role: userRole?.userRef
            }
        });
        // Return the Payload
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "User Business Accounts Fetched Successfully",
                {
                    length: businesses.length,
                    businesses,
                },
                true
            )
        )
    } catch (error) {
        console.log("Error in Fetch User Access Business Accounts:", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL,
                "Failed to Fetch User Business Accounts",
                { message: error?.message },
                false
            )
        );
    }
});

// @desc : Store The Selected Business Account To Fetch Respective Dashboard Feed
const updateTheSelectedBusinessAccount = catchAsync(async (req, res) => {
    // @route    : PATCH  /api/v2/businesses/mine
    try {
        // Extract the User Details From Request
        const { userRole, currUser } = req;

        // Validate the Requested User Details
        if (_.isEmpty(userRole?.userId)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField("User"));
        }
        if (_.isEmpty(currUser?.uid)) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField("User"));
        }

        // Extract The Custom Business Id From Request
        const { businessId } = req.body;

        // Validate Custom Business Id
        if (_.isEmpty(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("businessId"));
        }
        if (!helpers.isValidCustomId(businessId, "BIZ")) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("Business Id"));
        }

        // Check Business Account Is Exist Or Not
        const businessAccount = await Business.findOne({
            where: { customBusinessId: businessId },
            attributes: ['id', 'customBusinessId', 'firebaseId'],
            raw: true
        });
        if (_.isEmpty(businessAccount)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Business Account'));
        }

        // Check Business Account Has Align Access with the Requested User Or Not
        switch (userRole?.userRef) {
            case "MERCHANT": {
                // Merchant Can Access All Business Accounts
                if (businessAccount?.firebaseId !== currUser?.uid) {
                    throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField("Business Account"));
                }
                // Update The Business Account Into User Selection
                await Merchant.update(
                    { selectedBusinessId: businessAccount?.id },
                    { where: { id: userRole?.userId } }
                )
                break;
            };
            case "MANAGER": {
                // Manager Can Access Accounts Which Are Assigned To Him
                const isManagerAssigned = await StaffBusinessMap.findOne({
                    where: {
                        businessId: businessAccount?.id,
                        staffId: userRole?.userId,
                    },
                    attributes: ['id'],
                    raw: true
                });
                if (_.isEmpty(isManagerAssigned)) {
                    throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField("Business Account"));
                }
                // Update The Business Account Into User Selection
                await Manager.update(
                    { selectedBusinessId: businessAccount?.id },
                    { where: { id: userRole?.userId } }
                );
                break;
            };
            case "ANALYST": {
                // Analyst Can Access Accounts Which Are Assigned To Him
                const isAnalystAssigned = await StaffBusinessMap.findOne({
                    where: {
                        businessId: businessAccount?.id,
                        staffId: userRole?.userId,
                    },
                    attributes: ['id'],
                    raw: true
                });
                if (_.isEmpty(isAnalystAssigned)) { 
                    throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField("Business Account"));
                }
                // Update The Business Account Into User Selection
                await Analyst.update(
                    { selectedBusinessId: businessAccount?.id },
                    { where: { id: userRole?.userId } }
                );
                break;
            };
            default: {
                throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.UnAuthorizedField("User Role"));
            }
        }

        // Return The Payload
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "User Business Accounts Updated Successfully",
                {
                    selectedBusinessId: businessAccount?.id,
                    customBusinessId: businessAccount?.customBusinessId,
                    message: `Business Account ${businessAccount?.customBusinessId} Selected Successfully`,
                },
                true
            )
        );
    } catch (error) {
        console.log("Error in Updating the Selected Business Account in User Profile : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL,
                "Failed to Update User Business Accounts",
                { message: error?.message },
                false
            )
        );

    }
});

const businessAccountController = {
    fetchUserBusinessAccountsAccess,
    updateTheSelectedBusinessAccount
};

export default businessAccountController;