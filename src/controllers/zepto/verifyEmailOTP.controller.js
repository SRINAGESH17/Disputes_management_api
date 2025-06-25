/**
 * Controller to verify the Email OTP.
 *
 * @function
 * @name verifyEmailOTP
 * @async
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON response indicating the result of OTP verification.
 *
 * @description
 * This controller verifies the OTP sent to the user's email for email verification.
 * 
 * Steps:
 * 1. Extracts the email from request parameters and OTP details from request body.
 * 2. Validates the email and OTP fields for presence and correct format.
 * 3. Checks if the OTP reference exists in the database for the given email.
 * 4. If OTP is already verified, returns a success response.
 * 5. Compares the provided OTP with the stored OTP.
 * 6. Checks if the OTP has expired.
 * 7. Updates the OTP record as verified if all checks pass.
 * 8. Returns a success response if OTP is verified, otherwise returns an error response.
 *
 * @throws {AppError} If any validation or verification step fails, an appropriate error is thrown and handled.
 */
import AppErrorCode from "../../constants/AppErrorCodes.js";
import statusCodes from "../../constants/httpStatusCodes.js";
import AppError from "../../utils/AppError.js";
import catchAsync from "../../utils/catchAsync.js";
import { failed_response, success_response } from "../../utils/response.js";
import _ from 'lodash';
import { verificationCodes } from "../../constants/verificationCode.js";
import OTP from "../../models/otp.model.js";


const verifyEmailOTP = catchAsync(async (req, res) => {
    // @desc : Sent Email OTP to Verify Email
    try {

        // Step 1 : Extract the email from request
        const { email } = req.params;
        const { otp_number, otp_reference } = req.body;

        // Step 2 : Validate email and OTP fields
        if (_.isEmpty(email)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldIsRequired('email'));
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidEmailFormat);
        }

        if (_.isEmpty(otp_number)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldIsRequired('otp_number'));
        }
        if (_.isEmpty(otp_reference)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldIsRequired('otp_reference'));
        }

        if (!/^\d{6}$/.test(otp_number)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.InvalidFieldFormat('OTP'));
        }
        if (otp_reference?.length > 15) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.InvalidFieldFormat('otp_reference'));
        }

        // Step 3 : Check OTP reference Exist or not
        const emailVerifyPayload = {
            verificationKey: verificationCodes.email,
            verificationValue: email,
            otpReference: otp_reference,
        }

        let OTP_REF = await OTP.findOne({ where: emailVerifyPayload });
        console.log("TEST : ", emailVerifyPayload, OTP_REF);
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
        // Step 4 : Check OTP is Valid or not
        if (OTP_REF.otpNumber !== parseInt(otp_number)) {
            throw new AppError(statusCodes.BAD_REQUEST, 'Incorrect OTP. Try again.');
        }

        // Step 5 : Check OTP expired or not
        const now = new Date();
        if (OTP_REF.expiresIn <= now) {
            throw new AppError(statusCodes.BAD_REQUEST, 'OTP is Expired. Send OTP again');
        }

        // Step 5 : Update Email Verified status
        OTP_REF.isVerified = true;
        await OTP_REF.save();

        // Step 6 : Return response

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "OTP verified successfully",
                {
                    otpReference: otp_reference
                },
                true
            )
        )
    } catch (error) {
        console.log("Error in verify email OTP controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to verify Email OTP",
                    {
                        message: error?.message || "Failed to verify Email OTP",
                    },
                    false
                )
            );
    }
});

export default verifyEmailOTP;