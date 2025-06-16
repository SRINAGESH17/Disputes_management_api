import axios from "axios";
import env from "../../constants/env.js";


const sentVerifyMobileOTP = async (mobileNumber) => {
    const body = { var1: 5 };

    const response = await axios.post(
        `https://control.msg91.com/api/v5/otp`,
        body,
        {
            headers: {
                "Content-Type": "application/json",
            },
            params: {
                authkey: env.MSG_91_AUTH_KEY,
                mobile: mobileNumber,
                template_id: env.MSG_91_TEMPLATE_ID,
                otp_length: 6,
                otp_expiry: 5,
            },
        }
    );

    return response;
}

export default sentVerifyMobileOTP;