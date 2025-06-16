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