/**
 * Registers a new merchant account.
 *
 * @async
 * @function merchantRegisterService
 * @param {Object} data - The merchant registration data.
 * @param {string} data.name - The name of the merchant.
 * @param {string} data.email - The email address of the merchant.
 * @param {string} data.mobileNumber - The mobile number of the merchant.
 * @param {string} data.password - The password for the merchant account.
 * @returns {Promise<Object>} The registered merchant's details and a custom Firebase token.
 * @throws {AppError} Throws an error if registration fails at any step.
 *
 * @description
 * This service performs the following steps:
 * 1. Checks if the email and mobile number are already registered.
 * 2. Verifies that the email and mobile number have been verified via OTP.
 * 3. Creates a merchant account in Firebase.
 * 4. Creates a merchant record in the database and assigns a unique merchant ID.
 * 5. Assigns a merchant role to the user.
 * 6. Generates a custom Firebase token for authentication.
 * 7. Deletes OTP records for the merchant's email and mobile number.
 */

import _ from "lodash";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import statusCodes from "../../constants/status-codes.constant.js";
import { verificationCodes } from "../../constants/verification-codes.constant.js";
import {
  FirebaseCheckEmailExistOrNot,
  FirebaseCheckPhoneExistOrNot,
  FirebaseCreateUserAccount,
  FirebaseGenerateCustomToken,
} from "../../firebase/firebase-utils.js";
import OTP from "../../models/otp.model.js";
import Merchant from "../../models/merchant.model.js";
import AppError from "../../utils/app-error.util.js";
import UserRole from "../../models/user-role.model.js";
import { uniqueMerchantId } from "../../utils/generate-ids.util.js";
import { Op } from "sequelize";

const merchantRegisterService = async (data) => {
  // @desc : Create Merchant service
  try {
    const { name, email, mobileNumber, password } = data;

    // Step 1 : Check Email and mobileNumber already register or not table

    // Email validate payload
    const emailPayload = {
      verificationKey: verificationCodes.email,
      verificationValue: email,
      isVerified: true,
    };
    // Mobile number validate payload
    const mobilePayload = {
      verificationKey: verificationCodes.mobile_number,
      verificationValue: mobileNumber,
      isVerified: true,
    };

    const [
      userEmailRecord,
      userMobileRecord,
      // isEmailVerified,
      // isMobileNumberVerified
    ] = await Promise.all([
      FirebaseCheckEmailExistOrNot(email),
      FirebaseCheckPhoneExistOrNot(mobileNumber),
      // OTP.findOne({ where: emailPayload, attributes: ['verificationValue'], raw: true }),
      // OTP.findOne({ where: mobilePayload, attributes: ['verificationValue'], raw: true })
    ]);

    // 1.1 : Check Email is Exist or not
    if (userEmailRecord) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.EmailAlreadyRegistered
      );
    }

    // 1.2 : Check Mobile Number is Exist or not
    if (userMobileRecord) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.fieldAlreadyRegistered("Mobile Number")
      );
    }

    // Step 2 : Check Email and mobileNumber verified or not

    // 2.1 : Email is Verified or not
    // if (_.isEmpty(isEmailVerified)) {
    //   throw new AppError(statusCodes.BAD_REQUEST, 'Email is Not verified.');
    // }

    // 2.2 : mobile Number is Verified or not
    // if (_.isEmpty(isMobileNumberVerified)) {
    //   throw new AppError(statusCodes.BAD_REQUEST, 'Mobile Number is Not verified.');
    // }

    // Step 3 : Create Merchant Account in firebase

    const isUserCreated = await FirebaseCreateUserAccount({
      email,
      phoneNumber: mobileNumber,
      password,
      displayName: name,
    });

    if (!isUserCreated.status || _.isEmpty(isUserCreated?.user)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        "Firebase Merchant Account creation failed : " + isUserCreated.error
      );
    }
    // Step 4 : Create Merchant Account in db

    // 4.1 :Create merchant unique id
    const mobileDigits = mobileNumber.slice(-4);
    const merchantId = await uniqueMerchantId(mobileDigits);

    // 4.2 : Create account
    let merchant = await Merchant.create({
      name,
      email,
      mobileNumber,
      firebaseId: isUserCreated?.user?.uid,
      merchantId,
    });
    if (_.isEmpty(merchant)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.notAbleToCreateField("Merchant")
      );
    }
    // 4.3 : Create Merchant Role
    const merchantRole = {
      userId: merchant?.id,
      userRef: "MERCHANT",
      firebaseId: isUserCreated?.user?.uid,
      merchant: true,
    };

    const role = await UserRole.create(merchantRole);
    if (_.isEmpty(role)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.notAbleToCreateField("Merchant Role")
      );
    }
    // 4.4 Update role id into merchant
    merchant.userRole = role?.id;

    const [, customToken] = await Promise.all([
      // 4.4 Update role id into merchant
      merchant.save(),

      // Step 5 : Generate custom firebase token for login
      FirebaseGenerateCustomToken(isUserCreated?.user?.uid),

      // Step 6 : Deleting OTP records of merchant email and mobileNumber
      // OTP.destroy({
      //   where: { verificationValue: { [Op.in]: [email, mobileNumber] } },
      // }),
    ]);

    return {
      merchant: {
        id: merchant?.id,
        name: merchant?.name,
        firebaseId: merchant?.firebaseId,
        email: merchant?.email,
        mobileNumber: merchant?.mobileNumber,
      },
      customToken,
    };
  } catch (error) {
    console.log("Error from create merchant account service: ", error);
    throw new AppError(
      error?.statusCode || statusCodes.BAD_REQUEST,
      error?.message
    );
  }
};

export default merchantRegisterService;
