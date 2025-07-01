import express from 'express';
import AddMerchantStaff from '../controllers/merchant/staff/add-staff.controller.js';
import {addGateway, fetchGateways} from '../controllers/merchant/integration/gateway.controller.js';
import { verifyMerchant } from '../middlewares/auth.middleware.js';

const router = express.Router();



// *********************************** Staff Routes

// 1. Create Staff Account
// @route : POST /api/v2/merchant/staff/:merchantId
// @desc  : Add Merchant staff  
// @access: Private to merchant Only
router.post(
    '/staff/:merchantId',
    verifyMerchant,        // To Verify Merchant
    AddMerchantStaff       // Add Merchant Staff Controller
);


// ****************************Gateway*****************************/
// 2. Add Gateway
// @route : POST /api/v2/merchant/integration/gateway
// @desc  : Add Gateway for Merchant
// @access: Public
router.post('/integration/gateway', verifyMerchant, addGateway)

// 3. fetch Gateways
// @route : GET /api/v2/merchant/integration/gateway
// @desc  : Fetch Gateway for Merchant
// @access: Public
router.get('/integration/gateway', verifyMerchant, fetchGateways);




export default router;