import _ from 'lodash';
import AppErrorCode from '../../constants/AppErrorCodes.js';
import statusCodes from '../../constants/httpStatusCodes.js';
import AppError from '../../utils/AppError.js';
import requestIP from "request-ip";
import webhookProcessor from '../rabbitMQ/ProcessWebhook.class.js';

const disputeReceiveWebhook = async (req, res) => {
    try {

        // Step 1 : Extracted Data Payload From Request
        const { merchantId } = req.params;
        const rawPayload = req.body;
        const headers = req.headers;

        // Step 2  : Validate MerchantId is Valid or not

        // 2.1 : Check id must not Empty
        if (_.isEmpty(merchantId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('merchantId'));
        }
        if (_.isEmpty(rawPayload)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('Gateway Payload'));
        }

        // 2.2 : Check for valid id Format
        if (merchantId?.length !== 15 || merchantId.slice(0, 3) !== 'MID') {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('MerchantId'));
        }

        // Step 3  : IP Whitelisting of Gateway -----  Get the Ip Address Of the Sender
        const clientIp = requestIP.getClientIp(req);

        // Step 4 : Configure Payload For Publish Webhook Service
        const payload = {
            merchantId: merchantId,
            GatewayIP: clientIp,
            headers,
            rawPayload: rawPayload
        }
        await webhookProcessor.publishToExchange(payload);

        // Step 5 : return Acknowledgement to Gateways
        return res.status(statusCodes.OK).send('OK');
    } catch (error) {
        console.log("Error in Receive Dispute Webhook : ", error?.message);
        return res.status(statusCodes.BAD_REQUEST).json({
            message: error?.message
        });
    }
}

export default disputeReceiveWebhook;