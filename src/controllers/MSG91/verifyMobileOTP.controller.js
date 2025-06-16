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
        if (_.isEmpty(otp_number)) {
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