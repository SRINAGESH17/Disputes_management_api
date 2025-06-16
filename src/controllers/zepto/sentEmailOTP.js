import { SendMailClient } from "zeptomail";
import env from "../../constants/env.js";
import AppError from "../../utils/AppError.js";
import statusCodes from "../../constants/httpStatusCodes.js";

const sentEmailOTP = async (data) => {
    try {
        const url = "https://api.zeptomail.in/";

        const token = env.ZEPTO_MAIL_TOKEN;

        let zeptoMailClient = new SendMailClient({
            url: url,
            token: token,
        });

        const zeptoData = {
            template_key: env.zepto_email_template_key,
            from: {
                address: "noreply@payinstacard.com",
                name: "noreply",
            },
            to: [
                {
                    email_address: {
                        address: data.email,
                        name: data.name,
                    },
                },
            ],
            merge_info: {
                OTP: data.otp,
                name: data.name,
            },
            // reply_to: [
            //     {
            //         address: "info@chargeback.com",
            //         name: "Abdul Razzak",
            //     },
            // ],
        };

        const response = await zeptoMailClient.sendMailWithTemplate(zeptoData);
        console.log("OTP sent to email :", response)

        return response;
    } catch (error) {
        console.log("ERROR in Sending Verify Email OTP ", error.message);
        throw new AppError(statusCodes.INTERNAL_SERVER_ERROR, 'Failed to sent email OTP');
    }
};

export default sentEmailOTP;