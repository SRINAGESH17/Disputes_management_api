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