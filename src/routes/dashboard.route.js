import express from 'express';
import { verifyMerchantOrAnalyst } from '../middlewares/auth.middleware.js';
import UserDashboardController from '../controllers/dashboard/user-dashboard.controller.js';
import UserSpecificGatewayController from '../controllers/dashboard/user-gateway-dashboard.controller.js';

const router = express.Router();




//********************************************** User Dashboard **************************/

// 1. Fetch User Business Gateways Dispute Count
// @route     : GET  /api/v2/user/dashboard/gateway-disputes
// @desc      : Fetch The Total number Of Disputes Of Each Gateway Of Business Account
// @access    : Private to Merchant And Analyst Only
router.get(
    '/dashboard/gateway-disputes',
    verifyMerchantOrAnalyst,
    UserDashboardController.totalGatewayDisputes
);

// 2. Fetch User dashboard Gateway Dispute Analytics
// @route     : GET  /api/v2/user/dashboard/gateway-analytics
// @desc      : Fetch User Business Gateway Dispute Analytics
// @access    : Private to User And Analyst Only
router.get(
    '/dashboard/gateway-analytics',
    verifyMerchantOrAnalyst,
    UserDashboardController.gatewayDisputesAnalytics
);

// 3. Fetch User dashboard Gateway Dispute Financial Lost
// @route     : GET  /api/v2/user/dashboard/financial-loss
// @desc      : Fetch User Business Gateway Dispute Financial Loss
// @access    : Private to User And Analyst Only
router.get(
    '/dashboard/financial-loss',
    verifyMerchantOrAnalyst,
    UserDashboardController.fetchBusinessFinancialLost
);

// 4. Fetch User Dashboard Dispute Common Reason Analytics
// @route     : GET  /api/v2/user/dashboard/reason-analytics
// @desc      : Fetch User Dashboard Dispute Common Reason Analytics based on filters
// @access    : Private to User And Analyst Only
router.get(
    '/dashboard/reason-analytics',
    verifyMerchantOrAnalyst,
    UserDashboardController.fetchDisputeCommonReasonAnalytics
);

/************************************************* Dashboard Specific Gateway Routes **************************/

// 1. Fetch Dashboard Specific Gateway Dispute Count
// @route   GET /api/v2/user/dashboard/:gateway/counts
// @desc    Get dashboard Dispute counts for a specific gateway
// @access    : Private to Merchant And Analyst Only
router.get(
    '/dashboard/:gateway/counts',
    verifyMerchantOrAnalyst,
    UserSpecificGatewayController.fetchBusinessGatewayDisputesCount
);

// 2. Fetch Business Gateway Dispute Analytics
// @route   GET /api/v2/user/dashboard/:gateway/analytics
// @desc    Get dashboard Dispute analytics for a specific gateway
// @access    : Private to Merchant And Analyst Only
router.get(
    '/dashboard/:gateway/analytics',
    verifyMerchantOrAnalyst,
    UserSpecificGatewayController.fetchBusinessGatewayDisputeAnalytics
);
// 3. Fetch Business Gateway Dispute Money Lost Stats
// @route   GET /api/v2/user/dashboard/:gateway/money-loss
// @desc    Get dashboard Dispute money lost analytics for a specific gateway
// @access    : Private to Merchant And Analyst Only
router.get(
    '/dashboard/:gateway/money-loss',
    verifyMerchantOrAnalyst,
    UserSpecificGatewayController.getGatewayDisputeMoneyLost
);
// 4. Fetch Business Gateway Dispute Overview Stats
// @route   GET /api/v2/user/dashboard/:gateway/stats
// @desc    Get dashboard Dispute won and lost overview for a specific gateway
// @access    : Private to Merchant And Analyst Only
router.get(
    '/dashboard/:gateway/stats',
    verifyMerchantOrAnalyst,
    UserSpecificGatewayController.getGatewayWonAndLostOverview
);
// 4. Fetch Business Gateway Dispute Common reason Analytics
// @route   GET /api/v2/user/dashboard/:gateway/reason-analytics
// @desc    Get dashboard Dispute common reason analytics for a specific gateway
// @access    : Private to Merchant And Analyst Only
router.get(
    '/dashboard/:gateway/reason-analytics',
    verifyMerchantOrAnalyst,
    UserSpecificGatewayController.getBusinessGatewayCommonReasonAnalytics
);


export default router;