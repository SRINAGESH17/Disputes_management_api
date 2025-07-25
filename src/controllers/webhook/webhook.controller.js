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
        const events = ['created', 'under_review', 'action_required', 'won','won','won', 'lost'];
        for (let i = 0; i < 500; i++) {
            const randomIdWithBigString = `${Math.random().toString(36).substring(2, 23)}`;
            const randomTransactionId = `pay_${Math.random().toString(36).substring(2, 23)}`;
            const randomAmount = Math.floor(Math.random() * 10000) + 1000; // Random amount between 1000 and 1000000
            const gatewayReasons = ['unauthorized_transactions', 'service_not_rendered', 'product_not_received', 'product_not_delivered', 'product_not_as_it_described', 'duplicate_payment', 'Duplicate Processing', 'other'];
            const randomReason = gatewayReasons[Math.floor(Math.random() * gatewayReasons.length)];
            const randomPastDate = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
            const randomPastTime = Math.floor(randomPastDate.getTime() / 1000);
            const randomDueDateGreaterThanPastTime = randomPastTime + Math.floor(Math.random() * 10000000) + 1000; // Random due date greater than past time
            const randomEvent = events[Math.floor(Math.random() * events.length)];
            const disputeStatus = [
                // "DISPUTE_CREATED",
                // "DISPUTE_DOCS_RECEIVED",
                "DISPUTE_UNDER_REVIEW",
                "DISPUTE_MERCHANT_WON",
                "DISPUTE_MERCHANT_WON",
                "DISPUTE_MERCHANT_WON",
                "DISPUTE_MERCHANT_LOST",
                "DISPUTE_MERCHANT_ACCEPTED",
                "DISPUTE_INSUFFICIENT_EVIDENCE",
                // "RETRIEVAL_CREATED",
                // "RETRIEVAL_DOCS_RECEIVED",
                // "RETRIEVAL_UNDER_REVIEW",
                // "RETRIEVAL_MERCHANT_WON",
                // "RETRIEVAL_MERCHANT_LOST",
                // "RETRIEVAL_MERCHANT_ACCEPTED",
                // "RETRIEVAL_INSUFFICIENT_EVIDENCE",
                // "CHARGEBACK_CREATED",
                // "CHARGEBACK_DOCS_RECEIVED",
                // "CHARGEBACK_UNDER_REVIEW",
                // "CHARGEBACK_MERCHANT_WON",
                // "CHARGEBACK_MERCHANT_LOST",
                // "CHARGEBACK_MERCHANT_ACCEPTED",
                // "CHARGEBACK_INSUFFICIENT_EVIDENCE",
                // "PRE_ARBITRATION_CREATED",
                // "PRE_ARBITRATION_DOCS_RECEIVED",
                // "PRE_ARBITRATION_UNDER_REVIEW",
                // "PRE_ARBITRATION_MERCHANT_WON",
                // "PRE_ARBITRATION_MERCHANT_LOST",
                // "PRE_ARBITRATION_MERCHANT_ACCEPTED",
                // "PRE_ARBITRATION_INSUFFICIENT_EVIDENCE",
                // "ARBITRATION_CREATED",
                // "ARBITRATION_DOCS_RECEIVED",
                // "ARBITRATION_UNDER_REVIEW",
                // "ARBITRATION_MERCHANT_WON",
                // "ARBITRATION_MERCHANT_LOST",
                // "ARBITRATION_MERCHANT_ACCEPTED",
                // "ARBITRATION_INSUFFICIENT_EVIDENCE"
            ];
            const randomDisputeStatus = disputeStatus[Math.floor(Math.random() * disputeStatus.length)];
            const disputeEvent = ['DISPUTE_CREATED', 'DISPUTE_UPDATED', 'DISPUTE_CLOSED'];
            const randomCFEvent = disputeEvent[Math.floor(Math.random() * disputeEvent.length)];

            const payload1 = {
                "entity": "event",
                "account_id": "acc_CFvOKjkTwf3GQy",
                "event": `payment.dispute.${randomEvent}`,
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
                            "id": `disp_${randomIdWithBigString}`,
                            "entity": "dispute",
                            "payment_id": `pay_${randomTransactionId}`,
                            "amount": randomAmount,
                            "currency": "INR",
                            "amount_deducted": 0,
                            "reason_code": randomReason,
                            "respond_by": randomDueDateGreaterThanPastTime,
                            "status": randomEvent,
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
                            "created_at": randomPastTime
                        }
                    }
                },
                "created_at": randomPastTime
            }


            // const payload1 = {
            //     "data": {
            //         "dispute": {
            //             "dispute_id": randomIdWithBigString,
            //             "dispute_type": "CHARGEBACK",
            //             "reason_code": `${Math.floor(Math.random() * 1000000) + 1000}`,
            //             "reason_description": randomReason,
            //             "dispute_amount": randomAmount,
            //             "created_at": new Date(randomPastDate).toISOString(),
            //             "updated_at": new Date(randomPastDate).toISOString(),
            //             "respond_by": new Date(randomDueDateGreaterThanPastTime * 1000).toISOString(),
            //             "dispute_status": randomDisputeStatus,
            //             "cf_dispute_remarks": "Dispute is created, please take action",
            //             "dispute_action_on": "MERCHANT",
            //             "dispute_amount_currency": "INR"
            //         },
            //         "order_details": {
            //             "order_id": "order_1944392DR1kMTFYdIf8bI2awAcC3i9FTa",
            //             "order_amount": randomAmount,
            //             "order_currency": "INR",
            //             "cf_payment_id": randomTransactionId,
            //             "payment_amount": randomAmount,
            //             "payment_currency": "INR"
            //         },
            //         "customer_details": {
            //             "customer_name": "Dileep Kumar s",
            //             "customer_phone": "8000000000",
            //             "customer_email": "dileep@gmail.com"
            //         }
            //     },
            //     "event_time": new Date(randomPastDate).toISOString(),
            //     "type": randomCFEvent
            // }
            const payload = {
                businessId,
                GatewayIP: clientIp,
                headers,
                rawPayload: payload1
            }
            await webhookProcessor.publishToExchange(payload);
        }

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