/**
 * Service to add a new staff member for a merchant.
 *
 * Steps:
 * 1. Validates if the merchant exists.
 * 2. Checks if the staff email and mobile number are already registered.
 * 3. Verifies if the email and mobile number are verified via OTP.
 * 4. Creates a staff account in Firebase.
 * 5. Creates a staff record in the database and assigns a role and link to business accounts if exists.
 * 6. Cleans up OTP records for the used email and mobile number.
 *
 * @param {Object} data - Staff details.
 * @param {string} data.firstName - Staff's first name.
 * @param {string} data.lastName - Staff's last name.
 * @param {string} data.email - Staff's email address.
 * @param {string} data.mobileNumber - Staff's mobile number.
 * @param {string} data.password - Staff's password.
 * @param {string} data.role - Staff's role.
 * @param {string|number} data.merchantId - Merchant's ID.
 * @returns {Promise<Object>} Created staff details.
 * @throws {AppError} If any validation or creation step fails.
 */

import _ from "lodash";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import statusCodes from "../../constants/status-codes.constant.js";
import { verificationCodes } from "../../constants/verification-codes.constant.js";
import {
  FirebaseCheckEmailExistOrNot,
  FirebaseCheckPhoneExistOrNot,
  FirebaseCreateUserAccount,
} from "../../firebase/firebase-utils.js";
import OTP from "../../models/otp.model.js";
import Merchant from "../../models/merchant.model.js";
import AppError from "../../utils/app-error.util.js";
import UserRole from "../../models/user-role.model.js";
import { uniqueStaffId } from "../../utils/generate-ids.util.js";
import { Op } from "sequelize";
import sequelize from "../../config/database.config.js";
import Analyst from "../../models/analyst.model.js";
import Manager from "../../models/manager.model.js";
import Business from "../../models/business.model.js";
import StaffBusinessMap from "../../models/staff-business-map.model.js";


const addStaffAndLinkToBusinesses = async (data) => {
  try {
    const { firstName, lastName, staffId, email, mobileNumber, firebaseId, merchantId, userRole } = data;

    let payload = {
      firstName,
      lastName,
      staffId,
      email,
      mobileNumber,
      firebaseId,
      merchantId,
      // staffRole:userRole
    };
    let staff;

    // Add Analyst
    if (userRole === 'analyst') {
      staff = await Analyst.create(payload);
      if (_.isEmpty(staff)) {
        throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Business Analyst'));
      }
    }

    // Add Manager
    if (userRole === 'manager') {
      staff = await Manager.create(payload);
      if (_.isEmpty(staff)) {
        throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Business Manager'));
      }
    }

    // staff Role based on the analyst or manager

    // Generate Staff Role payload
    let staffRole = {
      userId: staff?.id,
      userRef: userRole?.toLowerCase() === 'analyst' ? 'ANALYST' : 'MANAGER',
      firebaseId: staff?.firebaseId,
    }
    if (userRole?.toLowerCase() === 'analyst') {
      staffRole.analyst = true;
    } else {
      staffRole.manager = true;
    }

    // Create Staff role record
    const role = await UserRole.create(staffRole);
    if (_.isEmpty(role)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Staff Business Role'));
    }

    staff.userRole = role?.id;

    // Update The Role and Increase Count of staff in merchant
    const bulkPayload = [];

    if (userRole?.toLowerCase() === 'analyst') {
      bulkPayload.push(
        Merchant.update(
          { totalAnalysts: sequelize.literal('total_analysts + 1') },
          {
            where: { id: merchantId },
          }
        ),
      );
    } else {
      bulkPayload.push(
        Merchant.update(
          { totalManagers: sequelize.literal('total_managers + 1') },
          {
            where: { id: merchantId },
          }
        ),
      );
    }

    bulkPayload.push(
      staff.save()
    );

    const businessAccounts = await Business.findAll({ where: { merchantId }, attributes: ['id', 'merchantId'], raw: true });
    if (!_.isEmpty(businessAccounts)) {
      const staffBusinessPayloads = businessAccounts?.map((business) => {
        return {
          staffId: staff?.id,
          staffRef: userRole?.toLowerCase() === 'analyst' ? 'ANALYST' : 'MANAGER',
          merchantId,
          businessId: business.id,
          firebaseId: staff?.firebaseId
        }
      });

      bulkPayload.push(
        StaffBusinessMap.bulkCreate(staffBusinessPayloads)
      );
    }

    // Execute the updates parallel
    await Promise.all(bulkPayload);

    return staff;

  } catch (error) {
    console.log("Error from create Analyst account service: ", error);
    throw new AppError(
      error?.statusCode || statusCodes.BAD_REQUEST,
      error?.message
    );
  }
}

const AddMerchantStaffService = async (data) => {
  // @desc : Create Merchant Staff service
  try {
    const {
      firstName,
      lastName,
      email,
      mobileNumber,
      password,
      role: userRole,
      merchantId,
    } = data;


    // Check Merchant exist or not
    const merchant = await Merchant.findOne({
      where: { id: merchantId },
      attributes: ["id", "email"],
      raw: true,
    });
    if (_.isEmpty(merchant)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.fieldNotFound("Merchant")
      );
    }

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
    //   throw new AppError(statusCodes.BAD_REQUEST, 'Please Verify Email first');
    // }

    // // 2.2 : mobile Number is Verified or not
    // if (_.isEmpty(isMobileNumberVerified)) {
    //   throw new AppError(statusCodes.BAD_REQUEST, 'Mobile Number is Not verified.');
    // }

    // Step 3 : Create Staff Account in firebase

    const mobileDigits = mobileNumber.slice(-4);

    const [isUserCreated, staffId] = await Promise.all([
      // Create Staff Account in firebase
      FirebaseCreateUserAccount({
        email,
        phoneNumber: mobileNumber,
        password,
        displayName: `${firstName} ${lastName}`,
      }),
      // Create Staff unique id
      uniqueStaffId(mobileDigits, userRole),
    ]);

    if (!isUserCreated.status || _.isEmpty(isUserCreated?.user)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        "Firebase Staff Account creation failed : " + isUserCreated.error
      );
    }

    // Step 4 : Create Staff Account in db

    // Create Staff Based on the Roles
    if (!['analyst', 'manager'].includes(userRole?.toLowerCase())) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldValue('Staff Role'));
    }
    const staffData = {
      firstName,
      lastName,
      staffId,
      email,
      mobileNumber,
      firebaseId: isUserCreated?.user?.uid,
      merchantId: merchant?.id,
      userRole,
    }
    // Add staff and link to respective business accounts if exist
    const staff = await addStaffAndLinkToBusinesses(staffData);

    // Step 5 : Deleting OTP records of merchant email and mobileNumber
    // await OTP.destroy({ where: { verificationValue: { [Op.in]: [email, mobileNumber] } } })

    return {
      staff: {
        id: staff?.id,
        firstName: staff?.firstName,
        lastName: staff?.lastName,
        firebaseId: staff?.firebaseId,
        email: staff?.email,
        mobileNumber: staff?.mobileNumber,
      },
    };
  } catch (error) {
    console.log("Error from create Staff account service: ", error);
    throw new AppError(
      error?.statusCode || statusCodes.BAD_REQUEST,
      error?.message
    );
  }
};

export default AddMerchantStaffService;
