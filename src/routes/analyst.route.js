import express from 'express';
import { verifyAnalyst, verifyMerchant } from '../middlewares/auth.middleware.js';
import analystDisputeWorkflowController from '../controllers/analyst/analyst-dispute-workflow.controller.js';
import analystProfileController from '../controllers/analyst/analyst-profile.controller.js';

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




export default router;