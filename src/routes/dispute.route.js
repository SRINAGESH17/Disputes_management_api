import express from 'express';
import { verifyUser } from '../middlewares/auth.middleware.js';
import disputeController from '../controllers/disputes/dispute.controller.js';

const router = express.Router();


//******************************** Disputes Apis *****************************************/

// 1. Fetch Dispute Format Data
// @route   : GET /api/v2/disputes/:disputeId/overview
// @desc    : Fetch Overview Of the Dispute
// @access  : Verified User ( Merchant, Manager, Analyst )
router.get(
    '/:disputeId/overview',
    verifyUser,
    disputeController.fetchDisputeOverview
);

// 2. Fetch Dispute Details
// @route   : GET /api/v2/disputes/:disputeId/details
// @desc    : Fetch Details Of the Dispute
// @access  : Verified User ( Merchant, Manager, Analyst )
router.get(
    '/:disputeId/details',
    verifyUser,
    disputeController.fetchDisputeDetails
);

// 3. Fetch Dispute Transaction Details
// @route   : GET /api/v2/disputes/:disputeId/transaction
// @desc    : Fetch Transaction and Time Of the Dispute
// @access  : Verified User ( Merchant, Manager, Analyst )
router.get(
    '/:disputeId/transaction',
    verifyUser,
    disputeController.fetchDisputeTransaction
);



export default router;