/** 
 * @function verifyMobileOTP
 * @description Verifies the OTP sent to a user's mobile number. This function validates the input data, checks the OTP reference, verifies the OTP using an external service, updates the OTP verification status, and returns the result.
 * Steps:
 * 1. Extract the mobile number and OTP references from the request.
 * 2. Validate incoming data fields:
 *    - Check if mobile number is present and in E.164 format.
 *    - Check if the mobile number is a valid Indian number.
 *    - Validate OTP number (6 digits).
 *    - Validate OTP reference (15 characters).
 * 3. Check if the OTP reference exists and is not already verified.
 * 4. Call the external service to verify the OTP.
 * 5. Update the OTP verification status in the database.
 * 6. Return the verification result with the reference ID.* 
 * 
 * @async
 * @param {import('express').Request} req - Express request object containing:
 *   - params.mobileNumber {string}: The mobile number to verify (in E.164 format).
 *   - body.otp_number {string|number}: The 6-digit OTP entered by the user.
 *   - body.otp_reference {string}: The OTP reference ID (15 characters).
 * @param {import('express').Response} res - Express response object used to send the verification result.
 * 
 * @returns {Promise<void>} Returns a JSON response with the verification status and reference ID.
 * 
 * @throws {AppError} Throws an error if validation fails, OTP is invalid, or verification fails.
 * 
 * @example
 *  Request
 * POST /verify-mobile-otp/:mobileNumber
 * {
 *   "otp_number": "123456",
 *   "otp_reference": "ABCDEFGHIJKLMNO"
 * }
 * 
 *  Success Response
 * {
 *   "status": 200,
 *   "message": "Mobile OTP Verified Successfully",
 *   "data": {
 *     "referenceId": "ABCDEFGHIJKLMNO"
 *   },
 *   "success": true
 * }
 */
import _ from "lodash";
import AppErrorCode from "../../constants/AppErrorCodes.js";
import statusCodes from "../../constants/httpStatusCodes.js";
import AppError from "../../utils/AppError.js";
import catchAsync from "../../utils/catchAsync.js";
import { failed_response, success_response } from "../../utils/response.js";
import { isValidIndianMobileNumber, validatePhoneNumber } from "./sentMobileOTP.controller.js";
import { verificationCodes } from "../../constants/verificationCode.js";
import OTP from "../../models/otp.model.js";
import verifyMobileNumberOTP from "./verifyMobileOTP.js";



const verifyMobileOTP = catchAsync(async (req, res) => {
    // @desc  : Verify the Mobile Number OTP 
    try {

        // Step 1 : Extract the mobile number and Otp references
        const { mobileNumber } = req.params;
        const { otp_number, otp_reference } = req.body;

        // Step 2 : Validate incoming data fields
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

        // 2.3 : Validate otp_number 
        if (_.isEmpty(otp_number) && !_.isInteger(otp_number)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldIsRequired('otp_number'));
        }
        if (!/^\d{6}$/.test(otp_number)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.InvalidFieldFormat('OTP'));
        }

        // 2.4 : Validate otp_reference 
        if (_.isEmpty(otp_reference)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldIsRequired('otp_reference'));
        }

        if (otp_reference?.length > 15 || otp_reference?.length < 15) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.InvalidFieldFormat('otp_reference'));
        }

        // Step 3 : Check for Reference OTP is exist or not

        const emailVerifyPayload = {
            verificationKey: verificationCodes.mobile_number,
            verificationValue: isValidPhone.phoneNumber,
            otpReference: otp_reference,
        }

        let OTP_REF = await OTP.findOne({ where: emailVerifyPayload });

        if (_.isEmpty(OTP_REF)) {
            throw new AppError(statusCodes.NOT_FOUND, "Invalid OTP. Send OTP again.");
        }

        if (OTP_REF.isVerified) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "OTP Already Verified",
                    {
                        referenceId: otp_reference
                    },
                    true
                )
            )
        }

        // Step 4 : Call the service to verify mobile Number

        const MSG_VERIFY_DATA = await verifyMobileNumberOTP(otp_number, isValidPhone.phoneNumber);
        // console.log("MSG_VERIFY_DATA : ", MSG_VERIFY_DATA);

        if (MSG_VERIFY_DATA?.data?.type !== "success") {
            throw new AppError(statusCodes.BAD_REQUEST, MSG_VERIFY_DATA?.message || 'Verification failed. Send OTP again.')
        }

        // Step 5 : Update the verified status for OTP reference
        OTP_REF.isVerified = true;
        await OTP_REF.save();

        // Step 6 : return reference Id
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Mobile OTP Verified Successfully",
                {
                    referenceId: otp_reference,
                },
                true
            )
        )
    } catch (error) {
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to Verify Mobile OTP",
                    {
                        message: error?.message || "Failed to Verify Mobile OTP",
                    },
                    false
                )
            );
    }
});


export default verifyMobileOTP;