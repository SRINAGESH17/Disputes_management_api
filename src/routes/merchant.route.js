import express from 'express';
import AddMerchantStaff from '../controllers/merchant/AddStaff.controller.js';
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


export default router;