
/**
 * resetPasswordService
 * 
 * Handles the process of resetting a user's password by verifying the OTP, 
 * checking the user's existence in Firebase, updating the password, and 
 * cleaning up OTP records.
 * 
 * @async
 * @function resetPasswordService
 * @param {Object} data - The input data for resetting the password.
 * @param {string} data.email - The email address of the user requesting the password reset.
 * @param {string} data.referenceId - The OTP reference ID associated with the password reset request.
 * @param {string} data.newPassword - The new password to set for the user.
 * 
 * @returns {Promise<Object>} An object containing the user's email and Firebase UID upon successful password reset.
 * 
 * @throws {AppError} Throws an error if any step fails, such as OTP not found, OTP not verified, user not found, or password update failure.
 * 
 * @description
 * Steps:
 * 1. Extracts the email, referenceId, and newPassword from the input data.
 * 2. Fetches the OTP reference for the provided email and referenceId.
 * 3. Validates that the OTP reference is verified.
 * 4. Checks if the user exists in Firebase using the provided email.
 * 5. Updates the user's password in Firebase and deletes the OTP record.
 * 6. Returns an acknowledgment containing the user's email and UID.
 */


import _ from "lodash";
import AppErrorCode from "../constants/app-error-codes.constant.js";
import statusCodes from "../constants/status-codes.constant.js";
import { verificationCodes } from "../constants/verification-codes.constant.js";
import OTP from "../models/otp.model.js";
import AppError from "../utils/app-error.util.js";
import { FirebaseCheckEmailExistOrNot, FirebaseUpdateUserPassword } from "../firebase/firebase-utils.js";


const resetPasswordService = async (data) => {
    try {
        // Step 1 : Extract the fields from params
        const { email, referenceId, newPassword } = data;

        // Step 2 : Fetch email OTP reference
        const otpPayload = {
            verificationKey: verificationCodes.email,
            verificationValue: email,
            otpReference: referenceId
        }
        console.time('otp');
        const otpReference = await OTP.findOne({ where: otpPayload, raw: true });
        if (_.isEmpty(otpReference)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('OTP Reference'));
        }
        console.timeEnd('otp')

        // Step 3 : Validate OTP reference is verified or not
        if (!otpReference?.isVerified) {
            throw new AppError(statusCodes.BAD_REQUEST, 'Reset Password Email Not Verified');
        }

        // Step 4 : Fetch user firebase account
        console.time('firebase');
        const userRecord = await FirebaseCheckEmailExistOrNot(email);
        if (_.isEmpty(userRecord)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('User'));
        }
        console.timeEnd('firebase')

        // Step 5 : Reset Password in user firebase account

        console.time('updates');
        const [userUpdateRecord,] = await Promise.all([
            // Update Firebase Password
            FirebaseUpdateUserPassword(userRecord?.uid, newPassword),

            // Deleting OTP records of merchant email and mobileNumber
            OTP.destroy({ where: { id: otpReference?.id } })
        ]);
        console.timeEnd('updates');
        if (_.isEmpty(userUpdateRecord)) {
            throw new AppError(statusCodes.BAD_REQUEST, 'Failed To Reset Password');
        }
        // Step 6 : Return Reset Acknowledgment
        return {
            email,
            userUid: userRecord?.uid
        }

    } catch (error) {
        console.log('Error from user reset password service: ', error);
        throw new AppError(error?.statusCode || statusCodes.BAD_REQUEST, error?.message);
    }
}

export default resetPasswordService;