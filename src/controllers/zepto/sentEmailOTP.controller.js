import AppErrorCode from "../../constants/AppErrorCodes.js";
import statusCodes from "../../constants/httpStatusCodes.js";
import AppError from "../../utils/AppError.js";
import catchAsync from "../../utils/catchAsync.js";
import { failed_response, success_response } from "../../utils/response.js";
import _ from 'lodash';
import { FirebaseCheckEmailExistOrNot } from "../../firebase/firebaseUtils.js";
import { generateOTP, generateReferenceID } from "../../utils/generateIds.js";
import sentEmailOTP from "./sentEmailOTP.js";
import { verificationCodes } from "../../constants/verificationCode.js";
import { OneMinuteFromNow } from "../../utils/dateHandlers.js";
import OTP from "../../models/otp.model.js";


const sentVerifyEmailOTP = catchAsync(async (req, res) => {
    // @desc : Sent Email OTP to Verify Email
    try {

        // Step 1 : Extract the email from request
        const { email } = req.params;

        // Step 2 : Validate email
        if (_.isEmpty(email)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldIsRequired('email'));
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidEmailFormat);
        }

        // Step 3 : Verify Email is already Exist or not

        // 3.1 : Check In Firebase
        let userRecord = await FirebaseCheckEmailExistOrNot(email);

        if (userRecord) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.EmailAlreadyRegistered);
        }

        // Step 4 : Generate reference Id and OTP for Email

        const generatedOTP = generateOTP();

        const referenceId = generateReferenceID();

        // Step 5 : Sent Email OTP

        const emailResponse = await sentEmailOTP({
            email,
            otp: generatedOTP,
            name: email.split('@')?.[0],
        });

        if (emailResponse?.message !== 'OK') {
            throw new AppError(statusCodes.BAD_REQUEST, 'Not Able to Sent Email OTP');
        }

        // Step 6 : Create Sent Email OTP Entity

        const otpPayload = {
            verificationKey: verificationCodes.email,
            verificationValue: email,
            otpReference: referenceId,
            otpNumber: generatedOTP,
            expiresIn: new Date(OneMinuteFromNow().toISOString())
        }

        const OtpData = await OTP.create(otpPayload);
        if (_.isEmpty(OtpData)) {
            throw new AppError(statusCodes.BAD_REQUEST, 'failed to save OTP');
        }

        // step 7 : Return OTP reference id

        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "verify email OTP is sent",
                {
                    email,
                    referenceId,
                },
                true
            )
        )
    } catch (error) {
        // console.log("Error in sent email OTP controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to sent Email OTP",
                    {
                        message: error?.message || "Failed to sent Email OTP",
                    },
                    false
                )
            );
    }
});

export default sentVerifyEmailOTP;