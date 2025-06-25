/**
 * Checks if a user exists in Firebase by their email.
 * @function FirebaseCheckEmailExistOrNot
 * @async
 * @param {string} email - The email address to check.
 * @returns {Promise<admin.auth.UserRecord|null>} The user record if found, otherwise null.
 */

/**
 * Checks if a user exists in Firebase by their phone number.
 * @function FirebaseCheckPhoneExistOrNot
 * @async
 * @param {string} mobileNumber - The phone number to check (in E.164 format).
 * @returns {Promise<admin.auth.UserRecord|null>} The user record if found, otherwise null.
 */

/**
 * Creates a new user account in Firebase Authentication.
 * @function FirebaseCreateUserAccount
 * @async
 * @param {Object} data - The user data.
 * @param {string} data.email - The user's email address.
 * @param {string} data.phoneNumber - The user's phone number (in E.164 format).
 * @param {string} data.password - The user's password.
 * @param {string} data.displayName - The user's display name.
 * @returns {Promise<Object>} The response object containing user, status, and error message.
 */

/**
 * Generates a custom authentication token for a Firebase user.
 * @function FirebaseGenerateCustomToken
 * @async
 * @param {string} uid - The user's unique identifier.
 * @returns {Promise<string>} The generated custom token.
 * @throws {AppError} If token generation fails.
 */

/**
 * Verifies a Firebase ID token and returns the decoded user information.
 * @function FirebaseVerifyIdToken
 * @async
 * @param {string} token - The Firebase ID token to verify.
 * @returns {Promise<Object>} The decoded user information.
 */


import statusCodes from '../constants/httpStatusCodes.js';
import AppError from '../utils/AppError.js';
import admin from './admin.js';


const FirebaseCheckEmailExistOrNot = async (email) => {
    const user = await admin.auth().getUserByEmail(email).catch(() => null);
    return user;
}

const FirebaseCheckPhoneExistOrNot = async (mobileNumber) => {

    const user = await admin.auth().getUserByPhoneNumber(mobileNumber).catch(() => null);
    return user;
}

const FirebaseCreateUserAccount = async (data) => {
    const response = {
        user: {},
        status: true,
        error: ""
    }
    try {
        const { email, phoneNumber, password, displayName } = data;
        const user = await admin.auth().createUser({
            email,
            phoneNumber,
            password,
            displayName,
            emailVerified: true,
            phoneNumberVerified: true
        });
        response.user = user;
    } catch (error) {
        response.error = error?.message;
        response.status = false;
    }
    return response;
}

const FirebaseGenerateCustomToken = async (uid) => {
    try {
        const token = await admin.auth().createCustomToken(uid);
        return token;
    } catch (error) {
        throw new AppError(statusCodes.INTERNAL_SERVER_ERROR, error?.message || 'Failed to generate custom token');
    }
}

const FirebaseVerifyIdToken = async (token) => {
    const userInfo = await admin.auth().verifyIdToken(token);
    return userInfo;
}

export {
    FirebaseCheckEmailExistOrNot,
    FirebaseCheckPhoneExistOrNot,
    FirebaseCreateUserAccount,
    FirebaseGenerateCustomToken,
    FirebaseVerifyIdToken
}


