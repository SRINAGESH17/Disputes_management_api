/**
 * Controller to handle incoming dispute webhooks from payment gateways.
 *
 * Steps performed by this controller:
 * 1. Extracts the merchant ID from the request parameters and the payload from the request body.
 * 2. Validates that the merchant ID and payload are present and correctly formatted.
 * 3. Checks that the merchant ID has the expected format (15 characters, starts with 'MID').
 * 4. Retrieves the sender's IP address for whitelisting purposes.
 * 5. Prepares and publishes the payload to the webhook processing service.
 * 6. Sends an acknowledgement response ('OK') to the gateway upon successful processing.
 *
 * @async
 * @function disputeReceiveWebhook
 * @param {import('express').Request} req - Express request object.
 *   @property {Object} params - URL parameters.
 *   @property {string} params.merchantId - The merchant ID in the URL path.
 *   @property {Object} body - The raw webhook payload from the gateway.
 *   @property {Object} headers - The HTTP headers from the request.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Sends HTTP 200 'OK' on success, or HTTP 400 with error message on failure.
 *
 * @throws {AppError} If merchantId or payload is missing or invalid.
 */

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