import express from 'express';
import managerDisputeWorkFlowController from '../controllers/manager/manger-dispute-work-flow.controller.js';
import { verifyManager } from '../middlewares/auth.middleware.js';
import managerProfileController from '../controllers/manager/manager-profile.controller.js';
import managerDashboardController from '../controllers/manager/manager-dashboard.controller.js';



const router = express.Router();

// ********************************* Manager Dispute Management *************************

// 1.Manager Assigned Disputes
// @route  : GET /api/v2/manager/disputes/assigned
// @desc   : Fetching the Disputes Submitted By Staff
// @access : private to Manager Only 
router.get('/disputes/submitted', verifyManager, managerDisputeWorkFlowController.getSubmittedDisputes);


//2.Manager Reviewed Disputes History
// @route   : GET /api/v2/manager/disputes/reviewed
// @desc    : Fetching the History of  Disputes which are Reviewed
// @access  : private to Manager only 
router.get('/disputes/reviewed', verifyManager, managerDisputeWorkFlowController.getDisputesReviewHistory);



//3.Manager Processed Disputes
// @route   : GET/api/v2/manager/disputes/processed/:search
// @desc    : Fetching the Processed Disputes based on Search
// @access  : Private to Manager Only
router.get('/disputes/processed/:stage', verifyManager, managerDisputeWorkFlowController.getManagerProcessedDisputes);


// ******************************************* Manager Profile ***********************************************


// 4 .Manager Profile
// @route    : GET /api/v2/manager/profile
// @desc     : Fetching Manager Details For Profile
// @access   : Private to Manager Only 
router.get('/profile', verifyManager, managerProfileController.getManagerProfile);



// ***************************************** Manager Dashboard **************************************************

// 5. Manager Dashboard Upcoming Deadline Disputes
// @route   : GET /api/v2/manager/disputes/deadline
// @desc    : Fetching the Upcoming Deadline
// @access  : Private to Manager Only

router.get('/disputes/deadline', verifyManager, managerDashboardController.getUpcomingDeadlineDisputes);


// 6. Manager Dashboard Dispute Status Cards
// @route  : GET  /api/v2/manager/disputes/requested/status
// @desc   : Fetching the Dispute Status Cards
// @access : Private to Manager Only
router.get('/disputes/requested/status', verifyManager, managerDashboardController.getManagerDisputeStatusCards);



// 7. Get Total Accepted Disputes Week Wise
// @route    : GET /api/v2/manager/disputes/analysis/accepted
// @desc     : Fetching the Accepted Disputes Week wise
// @access   : Private to Manger Only

router.get("/disputes/analysis/accepted", verifyManager, managerDashboardController.getWeekWiseAcceptedDisputes);



// 8 . Get Revenue Lost in Last 6 Months
// @route   : GET  /api/v2/manager/disputes/revenue/lost
// @desc    : Fetching the Revenue Lost in Last 6 Months
// @access  : Private to Manger only

router.get("/disputes/revenue/lost", verifyManager, managerDashboardController.getLastSixMonthsRevenueLost);

export default router;
