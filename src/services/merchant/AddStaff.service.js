/**
 * Service to add a new staff member for a merchant.
 *
 * Steps:
 * 1. Validates if the merchant exists.
 * 2. Checks if the staff email and mobile number are already registered.
 * 3. Verifies if the email and mobile number are verified via OTP.
 * 4. Creates a staff account in Firebase.
 * 5. Creates a staff record in the database and assigns a role.
 * 6. Cleans up OTP records for the used email and mobile number.
 *
 * @param {Object} data - Staff details.
 * @param {string} data.firstName - Staff's first name.
 * @param {string} data.lastName - Staff's last name.
 * @param {string} data.email - Staff's email address.
 * @param {string} data.mobileNumber - Staff's mobile number.
 * @param {string} data.password - Staff's password.
 * @param {string} data.role - Staff's role (optional).
 * @param {string|number} data.merchantId - Merchant's ID.
 * @returns {Promise<Object>} Created staff details.
 * @throws {AppError} If any validation or creation step fails.
 */

import _ from "lodash";
import AppErrorCode from "../../constants/AppErrorCodes.js";
import statusCodes from "../../constants/httpStatusCodes.js"
import { verificationCodes } from "../../constants/verificationCode.js";
import { FirebaseCheckEmailExistOrNot, FirebaseCheckPhoneExistOrNot, FirebaseCreateUserAccount } from "../../firebase/firebaseUtils.js";
import OTP from "../../models/otp.model.js";
import Merchant from "../../models/merchant.model.js";
import AppError from "../../utils/AppError.js"
import UserRole from "../../models/userRole.model.js";
import { uniqueStaffId } from "../../utils/generateIds.js";
import { Op } from "sequelize";
import Staff from "../../models/staff.model.js";

const AddMerchantStaffService = async (data) => {
    // @desc : Create Merchant Staff service
    try {

        const { firstName, lastName, email, mobileNumber, password, role: userRole, merchantId } = data;

        // Check Merchant exist or not 
        const merchant = await Merchant.findOne({ where: { id: merchantId }, attributes: ['id', 'email'], raw: true });
        if (_.isEmpty(merchant)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Merchant'));
        }

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
            isVerified: true
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

        // 1.1 : Check Email is Exist or testing staff
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
            throw new AppError(statusCodes.BAD_REQUEST, 'Please Verify Email first');
        }

        // 2.2 : mobile Number is Verified or not
        if (_.isEmpty(isMobileNumberVerified)) {
            throw new AppError(statusCodes.BAD_REQUEST, 'Mobile Number is Not verified.');
        }

        // Step 3 : Create Staff Account in firebase

        const isUserCreated = await FirebaseCreateUserAccount({
            email,
            phoneNumber: mobileNumber,
            password,
            displayName: `${firstName} ${lastName}`,
        });

        if (!isUserCreated.status || _.isEmpty(isUserCreated?.user)) {
            throw new AppError(statusCodes.BAD_REQUEST, 'Firebase Staff Account creation failed : ' + isUserCreated.error);
        }


        // Step 4 : Create Staff Account in db

        // 4.1 : Create Staff 
        // Create Staff unique id
        const mobileDigits = mobileNumber.slice(-4);
        const staffId = await uniqueStaffId(mobileDigits);
        // Create account
        const staff = await Staff.create({
            firstName,
            lastName,
            staffId,
            email,
            mobileNumber,
            firebaseId: isUserCreated?.user?.uid,
            merchantId: merchant?.id,
            staffRole: userRole || 'staff'
        });
        if (_.isEmpty(staff)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Staff'));
        }
        // 4.2 : Create Staff Role
        const staffRole = {
            userId: staff?.id,
            userRef: 'staff',
            firebaseId: isUserCreated?.user?.uid,
            staff: true
        }

        const role = await UserRole.create(staffRole);
        if (_.isEmpty(role)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Staff Role'));
        }

        staff.userRole = role?.id;
        await staff.save();

        // Step 5 : Deleting OTP records of merchant email and mobileNumber
        await OTP.destroy({ where: { verificationValue: { [Op.in]: [email, mobileNumber] } } });

        return {
            staff: {
                id: staff?.id,
                firstName: staff?.firstName,
                lastName: staff?.lastName,
                firebaseId: staff?.firebaseId,
                email: staff?.email,
                mobileNumber: staff?.mobileNumber
            }
        }
    } catch (error) {
        console.log('Error from create Staff account service: ', error);
        throw new AppError(error?.statusCode || statusCodes.BAD_REQUEST, error?.message);
    }
}

export default AddMerchantStaffService;