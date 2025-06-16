import express from 'express';

const router = express.Router();
import authRoutes from './auth.route.js';
import merchantRoutes from './merchant.route.js';
import receiveDisputesWebhook from '../controllers/webhook/webhook.controller.js';

// Default route to test API
const info = {
    name: 'dispute Api',
    version: '1.0.0',
    description: 'A Dispute Management System',
    author: 'ABDUL RAZZAK',
    license: 'MIT'
};
router.get('/info', (req, res) => {
    res.json({
        code: 200,
        message: "Server is running",
        response: info,
        status: true
    });
});


// 1. Auth Endpoints
router.use('/auth', authRoutes);


// 2. Webhook
// @route : POST /webhook/merchant/dispute/:merchantId
// @desc  : This is Webhook to receive the merchant disputes 
// @access: Private to Merchant based on merchantId
/*
    1. Verify Merchant id from webhook
    2. Detection : Detect Payment gateway
    3. Parser    : Parse the webhook payload based on respective gateway
    4. Adaptor   : Normalize the dispute payload or Adapt format
    5. Check for repetition of dispute
    6. Store Dispute or Update its history record if already exist
    7. Assign dispute to staff if exist using Round Robbin Algorithm
    8. Notify Merchant or Staff for the New Dispute or Change of Status
    9. return acknowledgement to the gateway
*/
router.post('/webhook/merchant/dispute/:merchantId', receiveDisputesWebhook);


// 3. Merchant routes

router.use('/api/v2/merchant',merchantRoutes);


export default router;