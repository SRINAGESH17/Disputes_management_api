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
        console.log("MSG_DATA : ", MSG_DATA?.message,MSG_DATA?.data);

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