import express from 'express';
import { verifyAnalyst } from '../middlewares/auth.middleware.js';
import analystDisputeWorkflowController from '../controllers/analyst/analyst-dispute-workflow.controller.js';
import analystProfileController from '../controllers/analyst/analyst-profile.controller.js';
import analystDashboardController from '../controllers/analyst/analyst-dashboard.controller.js';


const router = express.Router();


//*********************************************** Dispute Work Flow Routes *********************************** */


// 1. Fetch Analyst Assigned Disputes
// @route : GET /api/v2/analyst/disputes/assigned
// @desc  : Fetch the disputes which are assigned to Analyst
// @access: Private to Analyst
router.get(
    '/disputes/assigned',
    verifyAnalyst,
    analystDisputeWorkflowController.analystAssignedDisputes
);

// 1.  Fetch the specific Analyst Processed Disputes
// @route : GET /api/v2/analyst/disputes/process/:status
// @desc  : Fetch Analyst Submitted, Accepted, Rejected and resubmitted Disputes with filters
// @access: Private to Analyst
router.get(
    '/disputes/process/:status',
    verifyAnalyst,
    analystDisputeWorkflowController.analystProcessedDisputes
);


// 8. Fetch Analyst Profile
// @route  : GET /api/v2/analyst/profile
// @desc   : Fetch Analyst Profile
// @access : Private to Analyst Only !
router.get(
  '/profile',
  verifyAnalyst,
  analystProfileController.getAnalystProfile
);


/********************************************* Analyst Dashboard *********************************************/

// 1. Analyst Dashboard Dispute Status Cards
// @route  : GET  /api/v2/analyst/disputes/requested/status
// @desc   : Fetching the analyst dashboard dispute status cards
// @access : Private to Analyst Only
router.get('/disputes/requested/status', verifyAnalyst, analystDashboardController.getAnalystDisputeStatusCards);

// 2. Get Total Assigned Disputes Weekly Wise
// @route  : GET /api/v2/analyst/disputes/analysis/assigned
// @desc   : Fetching the Assigned Disputes Weekly wise
// @access : Private to Analyst Only
router.get("/disputes/analysis/assigned", verifyAnalyst, analystDashboardController.getWeeklyWiseAssignedDisputes);

// 3. Get Money Lost in Last 6 Months
// @route   : GET  /api/v2/analyst/disputes/money/lost
// @desc    : Fetching the Money Lost in Last 6 Months
// @access  : Private to analyst only
router.get("/disputes/money/lost", verifyAnalyst, analystDashboardController.getLastSixMonthsMoneyLost);

// 4. Analyst Dashboard Upcoming Deadline Disputes
// @route   : GET /api/v2/analyst/disputes/deadline
// @desc    : Fetching the Upcoming Deadline Disputes
// @access  : Private to analyst Only
router.get('/disputes/deadline', verifyAnalyst, analystDashboardController.getUpcomingDeadlineDisputes);



export default router;