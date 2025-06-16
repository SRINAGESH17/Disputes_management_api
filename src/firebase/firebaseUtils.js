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


export {
    FirebaseCheckEmailExistOrNot,
    FirebaseCheckPhoneExistOrNot,
    FirebaseCreateUserAccount,
    FirebaseGenerateCustomToken
}


