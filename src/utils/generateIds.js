/**
 * Utility functions for generating unique IDs and OTPs for merchants, staff, and disputes.
 * 
 * @module utils/generateIds
 */

/**
 * generateOTP
 * Generates a 6-digit numeric OTP (One Time Password).
 * @function generateOTP
 * @returns {number} A 6-digit OTP.
 */

/**
 * generateReferenceID
 * Generates a 15-character alphanumeric reference ID.
 * @function generateReferenceID
 * @returns {string} The generated reference ID.
 */

/**
 * generateMerchantID
 * Generates a merchant ID using the provided mobile digits and a unique numeric sequence.
 * @function generateMerchantID
 * @param {string} mobileDigits - The last digits of the merchant's mobile number.
 * @returns {string} The generated merchant ID.
 */

/**
 * uniqueMerchantId
 * Asynchronously generates a unique merchant ID, ensuring it does not already exist in the database.
 * @async
 * @function uniqueMerchantId
 * @param {string} mobileDigits - The last digits of the merchant's mobile number.
 * @returns {Promise<string>} The unique merchant ID.
 */

/**
 * generateStaffID
 * Generates a staff ID using the provided mobile digits and a unique numeric sequence.
 * @function generateStaffID
 * @param {string} mobileDigits - The last digits of the staff's mobile number.
 * @returns {string} The generated staff ID.
 */

/**
 * uniqueStaffId
 * Asynchronously generates a unique staff ID, ensuring it does not already exist in the database.
 * @async
 * @function uniqueStaffId
 * @param {string} mobileDigits - The last digits of the staff's mobile number.
 * @returns {Promise<string>} The unique staff ID.
 */

/**
 * generateDisputeID
 * Generates a dispute ID using the provided merchant ID and a unique numeric sequence.
 * @function generateDisputeID
 * @param {string} mid - The merchant ID to associate with the dispute.
 * @returns {string} The generated dispute ID.
 */

/**
 * uniqueDisputeId
 * Asynchronously generates a unique dispute ID, ensuring it does not already exist in the database.
 * @async
 * @function uniqueDisputeId
 * @param {string} mid - The merchant ID to associate with the dispute.
 * @param {object} t - The transaction object for database operations.
 * @returns {Promise<string>} The unique dispute ID.
 */
import _ from "lodash";
import Merchant from "../models/merchant.model.js";
import Dispute from "../models/dispute.model.js";
import Staff from "../models/staff.model.js";

//********************************************** For OTP reference */

function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
}

function generateReferenceID() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referenceID = '';
    for (let i = 0; i < 15; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referenceID += characters[randomIndex];
    }
    return referenceID;
}

//********************************************* For Merchant ***********************************8 */

function generateMerchantID(mobileDigits) {
    const prefix = 'MID';
    let numbering = Date.now().toString();
    numbering = numbering.split('').reverse().join('');
    if (numbering.length > 12) {
        numbering = numbering.slice(0, 8); // take first 8 after reversal
    } else if (numbering.length < 12) {
        const randomPad = Math.floor(Math.random() * Math.pow(10, 12 - numbering.length))
            .toString()
            .padStart(8 - numbering.length, '0');
        numbering = numbering + randomPad;
        numbering = numbering.split('').reverse().join('');
        numbering = numbering.slice(0, 8);
    }
    return `${prefix}${mobileDigits}${numbering}`;
}

async function uniqueMerchantId(mobileDigits) {
    let mid = generateMerchantID(mobileDigits);

    const isExist = await Merchant.findOne({ where: { merchantId: mid }, attributes: ['email'], raw: true });

    if (!_.isEmpty(isExist)) {
        return uniqueMerchantId(mobileDigits);
    }
    return mid;
}
//********************************************* For Staff ***********************************8 */

function generateStaffID(mobileDigits) {
    const prefix = 'SID';
    let numbering = Date.now().toString();
    numbering = numbering.split('').reverse().join('');
    if (numbering.length > 12) {
        numbering = numbering.slice(0, 8); // take first 8 after reversal
    } else if (numbering.length < 12) {
        const randomPad = Math.floor(Math.random() * Math.pow(10, 12 - numbering.length))
            .toString()
            .padStart(8 - numbering.length, '0');
        numbering = numbering + randomPad;
        numbering = numbering.split('').reverse().join('');
        numbering = numbering.slice(0, 8);
    }
    return `${prefix}${mobileDigits}${numbering}`;
}

async function uniqueStaffId(mobileDigits) {
    let mid = generateStaffID(mobileDigits);

    const isExist = await Staff.findOne({ where: { staffId: mid }, attributes: ['email'], raw: true });

    if (!_.isEmpty(isExist)) {
        return uniqueStaffId(mobileDigits);
    }
    return mid;
}

//************************************* For Disputes *************************************88 */

function generateDisputeID(mid) {
    const prefix = 'DIS';
    let numbering = Date.now().toString();
    numbering = numbering.split('').reverse().join('');
    if (numbering.length > 12) {
        numbering = numbering.slice(0, 8); // take first 8 after reversal
    } else if (numbering.length < 12) {
        const randomPad = Math.floor(Math.random() * Math.pow(10, 12 - numbering.length))
            .toString()
            .padStart(8 - numbering.length, '0');
        numbering = numbering + randomPad;
        numbering = numbering.split('').reverse().join('');
        numbering = numbering.slice(0, 8);
    }
    return `${prefix}${mid}${numbering}`;
}

async function uniqueDisputeId(mid, t) {
    let id = generateDisputeID(mid);

    const isExist = await Dispute.findOne({ where: { customId: id }, attributes: ['disputeId'], transaction: t, raw: true });

    if (!_.isEmpty(isExist)) {
        return generateDisputeID(mid);
    }
    return id;
}





export { generateOTP, generateReferenceID, uniqueMerchantId, uniqueDisputeId, uniqueStaffId };