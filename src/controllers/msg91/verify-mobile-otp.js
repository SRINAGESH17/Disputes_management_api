/**
 * Verifies a mobile number OTP using the MSG91 API.
 *
 * @async
 * @function
 * @param {string} otp - The OTP code to verify.
 * @param {string} mobileNumber - The mobile number to verify the OTP against.
 * @returns {Promise<Object>} The response from the MSG91 API.
 * @throws {Error} If the request to MSG91 fails.
 */
import axios from "axios";
import env from "../../constants/env.js";


const verifyMobileNumberOTP = async (otp, mobileNumber) => {

    const response = await axios.post(
        `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${mobileNumber}`,
        {},
        {
            headers: {
                "Content-Type": "application/json",
            },
            params: {
                authkey: env.MSG_91_AUTH_KEY,
            },
        }
    );

    return response;
}

export default verifyMobileNumberOTP;