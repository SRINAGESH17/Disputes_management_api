import express from 'express';
import registerMerchant from '../controllers/merchant/register.controller.js';
import sentVerifyEmailOTP from '../controllers/zepto/sent-email-otp.controller.js';
import verifyEmailOTP from '../controllers/zepto/verify-email-otp.controller.js';
import verifyMobileOTP from '../controllers/msg91/verify-mobile-otp.controller.js';
import sentMobileOTP from '../controllers/msg91/sent-mobile-otp.controller.js';
import sentForgotPasswordEmailOTP from '../controllers/zepto/sent-forgot-password-otp.controller.js';
import verifyForgotPasswordEmailOTP from '../controllers/zepto/verify-forgot-password-otp.controller.js';
import resetUserPassword from '../controllers/forgot-password.controller.js';

const router = express.Router();


// 1.  EMAIL OTP
// 2.  Mobile Number OTP
// 3.  Merchant Registration
// 4.  Forgot Password




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


// ******************************************** Forgot Password **************************************

// Sent Email OTP
// @route       : POST /auth/forgot-password/sent-email-otp/:email
// @desc        : Sent Forgot password email OTP
// @access      : Public
router.post('/forgot-password/sent-email-otp/:email', sentForgotPasswordEmailOTP);

// Verify Email OTP
// @route       : POST /auth/forgot-password/verify-email-otp/:email
// @desc        : Verify Forgot password email OTP
// @access      : Public
router.post('/forgot-password/verify-email-otp/:email', verifyForgotPasswordEmailOTP);

// Reset Password
// @route       : POST /auth/forgot-password/reset-password/:email
// @desc        : Reset Password
// @access      : Public
router.post('/forgot-password/reset-password/:email', resetUserPassword);


export default router;