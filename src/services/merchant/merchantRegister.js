import _ from "lodash";
import AppErrorCode from "../../constants/AppErrorCodes.js";
import statusCodes from "../../constants/httpStatusCodes.js"
import { verificationCodes } from "../../constants/verificationCode.js";
import { FirebaseCheckEmailExistOrNot, FirebaseCheckPhoneExistOrNot, FirebaseCreateUserAccount, FirebaseGenerateCustomToken } from "../../firebase/firebaseUtils.js";
import OTP from "../../models/otp.model.js";
import Merchant from "../../models/merchant.model.js";
import AppError from "../../utils/AppError.js"
import UserRole from "../../models/userRole.model.js";
import { uniqueMerchantId } from "../../utils/generateIds.js";
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
            isVerified: true
        }
        // Mobile number validate payload
        const mobilePayload = {
            verificationKey: verificationCodes.mobile_number,
            verificationValue: mobileNumber,
            isVerified: false
        }

        const [
            userEmailRecord,
            userMobileRecord,
            isEmailVerified,
            isMobileNumberVerified
        ] = await Promise.all([
            FirebaseCheckEmailExistOrNot(email),
            FirebaseCheckPhoneExistOrNot(mobileNumber),
            OTP.findOne({ where: emailPayload, attributes: ['verificationValue'], raw: true }),
            OTP.findOne({ where: mobilePayload, attributes: ['verificationValue'], raw: true })
        ]);

        // 1.1 : Check Email is Exist or not
        if (userEmailRecord) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.EmailAlreadyRegistered);
        }

        // 1.2 : Check Mobile Number is Exist or not
        if (userMobileRecord) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldAlreadyRegistered('Mobile Number'));
        }

        // Step 2 : Check Email and mobileNumber verified or not

        // 2.1 : Email is Verified or not
        if (_.isEmpty(isEmailVerified)) {
            throw new AppError(statusCodes.BAD_REQUEST, 'Email is Not verified.');
        }

        // 2.2 : mobile Number is Verified or not
        if (_.isEmpty(isMobileNumberVerified)) {
            throw new AppError(statusCodes.BAD_REQUEST, 'Mobile Number is Not verified.');
        }

        // Step 3 : Create Merchant Account in firebase

        const isUserCreated = await FirebaseCreateUserAccount({
            email,
            phoneNumber: mobileNumber,
            password,
            displayName: name,
        });

        if (!isUserCreated.status || _.isEmpty(isUserCreated?.user)) {
            throw new AppError(statusCodes.BAD_REQUEST, 'Firebase Merchant Account creation failed : ' + isUserCreated.error);
        }
        // Step 4 : Create Merchant Account in db


        // 4.1 :Create merchant unique id
        const mobileDigits = mobileNumber.slice(-4);
        const merchantId = await uniqueMerchantId(mobileDigits);

        // 4.2 : Create account
        const merchant = await Merchant.create({
            name,
            email,
            mobileNumber,
            firebaseId: isUserCreated?.user?.uid,
            merchantId
        });
        if (_.isEmpty(merchant)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Merchant'));
        }
        // 4.3 : Create Merchant Role
        const merchantRole = {
            userId: merchant?.id,
            userRef: 'merchant',
            firebaseId: isUserCreated?.user?.uid,
            merchant: true
        }

        const role = await UserRole.create(merchantRole);
        if (_.isEmpty(role)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Merchant Role'));
        }
        // 4.4 Update role id into merchant
        merchant.userRole = role?.id;
        await merchant.save();

        // Step 5 : Generate custom firebase token for login

        const customToken = await FirebaseGenerateCustomToken(isUserCreated?.user?.uid);

        // Step 6 : Deleting OTP records of merchant email and mobileNumber
        await OTP.destroy({ where: { verificationValue: { [Op.in]: [email, mobileNumber] } } });

        return {
            merchant: {
                id: merchant?.id,
                name: merchant?.name,
                firebaseId: merchant?.firebaseId,
                email: merchant?.email,
                mobileNumber: merchant?.mobileNumber
            },
            customToken
        }
    } catch (error) {
        console.log('Error from create merchant account service: ', error);
        throw new AppError(error?.statusCode || statusCodes.BAD_REQUEST, error?.message);
    }
}

export default merchantRegisterService;