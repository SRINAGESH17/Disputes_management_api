import express from 'express';
import registerMerchant from '../controllers/merchant/register.controller.js';
import sentVerifyEmailOTP from '../controllers/zepto/sent-email-otp.controller.js';
import verifyEmailOTP from '../controllers/zepto/verify-email-otp.controller.js';
import verifyMobileOTP from '../controllers/msg91/verify-mobile-otp.controller.js';
import sentMobileOTP from '../controllers/msg91/sent-mobile-otp.controller.js';

const router = express.Router();

// ********************************************** EMAIL OTP ******************************************

// @route        : POST  /auth/sent-email-otp/:email
// @desc         : Sent OTP to verify merchant or Staff Email
// @access       : Public  
router.post('/sent-email-otp/:email', sentVerifyEmailOTP);


// @route        : POST  /auth/verify-email-otp/:email
// @desc         : Verify Email OTP 
// @access       : Public  
router.post('/verify-email-otp/:email', verifyEmailOTP);


// ********************************************* Mobile Number OTP *****************************************

// @route        : POST  /auth/sent-mobile-number-otp/:mobileNumber
// @desc         : Sent OTP to verify merchant or Staff Mobile Number
// @access       : Public  
router.post('/sent-mobile-number-otp/:mobileNumber', sentMobileOTP);


// @route        : POST  /auth/verify-mobile-number-otp/:mobileNumber
// @desc         : Verify mobile number OTP 
// @access       : Public  
router.post('/verify-mobile-number-otp/:mobileNumber', verifyMobileOTP);


// ******************************************** Merchant Registration **************************************
// @route       : POST /auth/register
// @desc        : Create Merchant Account
// @access      : Public to Merchants
router.post('/register', registerMerchant);


export default router;