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
import AppErrorCode from '../../constants/app-error-codes.constant.js';
import statusCodes from '../../constants/status-codes.constant.js';
import AppError from '../../utils/app-error.util.js';
import requestIP from "request-ip";
import webhookProcessor from '../rabbitmq/process-webhook.class.js';

const disputeReceiveWebhook = async (req, res) => {
    try {

        // Step 1 : Extracted Data Payload From Request
        const { businessId } = req.params;
        const rawPayload = req.body;
        const headers = req.headers;

        // Step 2  : Validate MerchantId is Valid or not

        // 2.1 : Check id must not Empty
        if (_.isEmpty(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('businessId'));
        }
        if (_.isEmpty(rawPayload)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('Gateway Payload'));
        }

        // 2.2 : Check for valid id Format
        if (businessId?.length !== 15 || businessId.slice(0, 3) !== 'BIZ') {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('BusinessId'));
        }

        // Step 3  : IP Whitelisting of Gateway -----  Get the Ip Address Of the Sender
        const clientIp = requestIP.getClientIp(req);

        // Step 4 : Configure Payload For Publish Webhook Service
        const events = ['created','under_review','action_required','']
        for (let i = 0; i < 200; i++) {
            const payload = {
                "entity": "event",
                "account_id": "acc_CFvOKjkTwf3GQy",
                "event": "payment.dispute.action_required",
                "contains": [
                    "payment",
                    "dispute"
                ],
                "payload": {
                    "payment": {
                        "entity": {
                            "id": "pay_EFtmUsbwpXwBHI",
                            "entity": "payment",
                            "amount": 5297600,
                            "currency": "INR",
                            "base_amount": 5297600,
                            "status": "captured",
                            "order_id": "order_EFtkA6f5jdkfug",
                            "invoice_id": null,
                            "international": false,
                            "method": "card",
                            "amount_refunded": 700000,
                            "amount_transferred": 0,
                            "refund_status": "partial",
                            "captured": true,
                            "description": null,
                            "card_id": "card_EADblPSDnnk5ZG",
                            "bank": "HDFC",
                            "wallet": null,
                            "vpa": null,
                            "email": "gaurav.kumar@example.com",
                            "contact": "+919900000000",
                            "notes": [],
                            "fee": 0,
                            "tax": 0,
                            "error_code": null,
                            "error_description": null,
                            "error_source": null,
                            "error_step": null,
                            "error_reason": null,
                            "acquirer_data": {},
                            "created_at": 1581525157
                        }
                    },
                    "dispute": {
                        "entity": {
                            "id": "disp_EsIAlDcoUr8CanTEST9",
                            "entity": "dispute",
                            "payment_id": "pay_EFtmUsbwpXwBHz",
                            "amount": 5000,
                            "currency": "INR",
                            "amount_deducted": 0,
                            "reason_code": "unauthorized_transactions",
                            "respond_by": 1590431400,
                            "status": "action_required",
                            "evidence": {
                                "amount": 39000,
                                "summary": null,
                                "shipping_proof": null,
                                "billing_proof": null,
                                "cancellation_proof": null,
                                "customer_communication": null,
                                "proof_of_service": null,
                                "explanation_letter": null,
                                "refund_confirmation": null,
                                "access_activity_log": null,
                                "refund_cancellation_policy": null,
                                "term_and_conditions": null,
                                "others": null,
                                "submitted_at": null
                            },
                            "phase": "chargeback",
                            "created_at": 1589907957
                        }
                    }
                },
                "created_at": 1589907977
            }
        }
        const payload = {
            businessId,
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