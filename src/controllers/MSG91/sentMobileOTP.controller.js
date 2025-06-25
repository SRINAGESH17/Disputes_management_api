/**
 * Validates if the given phone number is in E.164 format.
 *
 * @function validatePhoneNumber
 * @param {string} phone - The phone number to validate.
 * @returns {{ isValid: boolean, message?: string }} - Validation result and message if invalid.
 */

/**
 * Checks if the input is a valid Indian mobile number and normalizes it to E.164 format.
 *
 * @function isValidIndianMobileNumber
 * @param {string} input - The mobile number input to validate and normalize.
 * @returns {{ isValid: boolean, phoneNumber: string }} - Validation result and normalized phone number.
 */

/**
 * Controller to send OTP to a mobile number for verification.
 *
 * @function sentMobileOTP
 * @async
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with OTP reference ID or error message.
 *
 * @throws {AppError} - Throws error if validation fails or OTP sending fails.
 *
 * @description
 * Steps:
 * 1. Extracts the mobile number from request parameters.
 * 2. Validates the mobile number for presence and E.164 format.
 * 3. Checks if the mobile number is a valid Indian number.
 * 4. Checks if the mobile number is already registered.
 * 5. Generates OTP and reference ID.
 * 6. Sends OTP to the mobile number.
 * 7. Creates OTP reference record in the database.
 * 8. Returns the reference ID in the response.
 *
 * @variable {string} mobileNumber - Mobile number to which OTP will be sent.
 * @variable {Object} phone - Result of E.164 format validation.
 * @variable {Object} isValidPhone - Result of Indian mobile number validation.
 * @variable {Object|null} userRecord - Result of checking if the mobile number exists.
 * @variable {string} generatedOTP - Generated OTP value.
 * @variable {string} referenceId - Generated reference ID for OTP.
 * @variable {Object} MSG_DATA - Result of sending OTP to mobile.
 * @variable {Object} otpPayload - Payload for creating OTP record.
 * @variable {Object} OtpData - Created OTP record in the database.
 */

// start of the sent Mobile OTP Controller

import _ from "lodash";
import statusCodes from "../../constants/httpStatusCodes.js";
import catchAsync from "../../utils/catchAsync.js";
import { failed_response, success_response } from "../../utils/response.js";
import AppError from "../../utils/AppError.js";
import AppErrorCode from "../../constants/AppErrorCodes.js";
import { FirebaseCheckPhoneExistOrNot } from "../../firebase/firebaseUtils.js";
import { generateOTP, generateReferenceID } from "../../utils/generateIds.js";
import { verificationCodes } from "../../constants/verificationCode.js";
import { fiveMinutesFromNow } from "../../utils/dateHandlers.js";
import OTP from "../../models/otp.model.js";
import sentVerifyMobileOTP from "./sentOtpToMobile.js";
import { parsePhoneNumberFromString } from 'libphonenumber-js'

export const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    if (!phone || typeof phone !== "string") {
        return { isValid: false, message: "Mobile number is required" };
    }
    if (!phoneRegex.test(phone)) {
        return { isValid: false, message: "Invalid mobile number format. Use E.164 format (e.g. +919876543210)" };
    }
    return { isValid: true };
};


export const isValidIndianMobileNumber = (input) => {
    // Remove all non-digit and non-plus characters
    const cleaned = input.replace(/[^\d+]/g, '');

    let normalized = cleaned;

    if (cleaned.startsWith('+91')) {
        normalized = cleaned;
    } else if (cleaned.startsWith('91')) {
        normalized = '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
        normalized = '+91' + cleaned.slice(1); // remove 0 and add +91
    } else if (/^\d{10}$/.test(cleaned)) {
        normalized = '+91' + cleaned; // assume local 10-digit number
    } else {
        return { isValid: false, phoneNumber: normalized }; // Doesn't match any recognizable Indian format
    }

    const phoneNumber = parsePhoneNumberFromString(normalized);

    // Final checks
    return {
        isValid: (
            phoneNumber?.isValid() &&
            phoneNumber.country === 'IN' &&
            /^(\+91)?[6-9]\d{9}$/.test(normalized) // must start with 6-9 and be 10 digits after +91
        ),
        phoneNumber: normalized
    };
}


const sentMobileOTP = catchAsync(async (req, res) => {
    // @desc : Sent Mobile OTP to verify Phone Number
    try {

        // Step 1 : Extract the data from request
        const { mobileNumber } = req.params;

        // Step 2 : Validate the Mobile number 
        if (_.isEmpty(mobileNumber)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('mobileNumber'));
        }
        // 2.1 : Validation E.164 Mobile Format
        const phone = validatePhoneNumber(mobileNumber);
        if (!phone?.isValid) {
            throw new AppError(statusCodes.BAD_REQUEST, phone?.message || "Invalid Mobile Number Format");
        }

        // 2.2 : Validating the mobile number is valid indian mobile number or not
        const isValidPhone = isValidIndianMobileNumber(mobileNumber);
        if (!isValidPhone.isValid) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('Mobile Number. Use Complete E.164'));
        }

        // Step 3 : Check whether mobile number is already Exist or not
        const userRecord = await FirebaseCheckPhoneExistOrNot(mobileNumber);
        if (userRecord) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldAlreadyRegistered('Mobile Number'))
        }

        // Step 4 : generate OTP and reference id

        const generatedOTP = generateOTP();

        const referenceId = generateReferenceID();

        // Step 5 : Sent Mobile OTP

        const MSG_DATA = await sentVerifyMobileOTP(mobileNumber);
        // console.log("MSG_DATA : ", MSG_DATA?.message,MSG_DATA?.data);

        if (MSG_DATA?.data?.type !== "success") {
            throw new AppError(statusCodes.BAD_REQUEST, MSG_DATA?.message || 'Failed to sent OTP')
        }

        // Step 6 : Create OTP reference record
        const otpPayload = {
            verificationKey: verificationCodes.mobile_number,
            verificationValue: mobileNumber,
            otpReference: referenceId,
            otpNumber: generatedOTP,
            expiresIn: new Date(fiveMinutesFromNow().toISOString())
        }
        const OtpData = await OTP.create(otpPayload);

        if (_.isEmpty(OtpData)) {
            throw new AppError(statusCodes.BAD_REQUEST, 'failed to save OTP');
        }

        // Step 7 : Return Payload
        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "OTP Sent To Mobile Number",
                {
                    referenceId,
                },
                true
            )
        )
    } catch (error) {
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to sent Mobile OTP",
                    {
                        message: error?.message || "Failed to sent Mobile OTP",
                    },
                    false
                )
            );
    }
});


export default sentMobileOTP;