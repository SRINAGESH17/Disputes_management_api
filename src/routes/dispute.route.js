import express from 'express';
import { verifyMerchantOrAnalyst, verifyMerchantOrManager, verifyUser } from '../middlewares/auth.middleware.js';
import disputeController from '../controllers/disputes/dispute.controller.js';
import upload from '../middlewares/upload.middleware.js';
import managedDisputeController from '../controllers/disputes/gateway-dispute.controller.js';
import getDisputesHistory from '../controllers/disputes/dispute-review-history.controller.js';

const router = express.Router();


// 1. Disputes Apis
// 2. Dispute Attachments


//******************************** 1.Disputes Apis *****************************************/

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

// 3. Update Dispute Details ( e.g : explanation, reason Contest, Internal Notes)
// @route   : PATCH /api/v2/disputes/:disputeId/details
// @desc    : Update Details Of The Dispute ( explanation, reason Contest, Internal Notes )
// @access  : Verified User ( Merchant, Analyst )
router.patch(
    '/:disputeId/details',
    verifyMerchantOrAnalyst,
    disputeController.updateDisputeDetails
);

// 4. Fetch Dispute Transaction Details
// @route   : GET /api/v2/disputes/:disputeId/transaction
// @desc    : Fetch Transaction and Time Of the Dispute
// @access  : Verified User ( Merchant, Manager, Analyst )
router.get(
    '/:disputeId/transaction',
    verifyUser,
    disputeController.fetchDisputeTransaction
);


// ******************************************************** 2.Dispute Attachments ********************

// 1. Add File into Dispute Attachment
// @route   : POST /api/v2/disputes/:disputeId/attachments
// @desc    : Add File into Dispute Attachments
// @access  : Verified User ( Merchant, Analyst )
router.post(
    '/:disputeId/attachments',
    verifyMerchantOrAnalyst,
    upload,
    disputeController.addFileIntoDisputeAttachments
);

// 2. Fetch All Attachments of Specific Dispute
// @route   : GET /api/v2/disputes/:disputeId/attachments
// @desc    : Fetch All Attachments of Specific Dispute
// @access  : Verified User ( Merchant, Analyst, Manager )
router.get(
    '/:disputeId/attachments',
    verifyUser,
    disputeController.fetchDisputesAttachments
);


// 3. Submit or Resubmit the attached documents to merchant or manager
// @route   : PATCH /api/v2/disputes/:disputeId/attachments/submit
// @desc    : Submit or Resubmit the uploaded dispute attachments to Manager or Merchant
// @access  : Verified User ( Merchant, Analyst )
router.patch(
    '/:disputeId/attachments/submit',
    verifyMerchantOrAnalyst,
    disputeController.submitOrResubmitDisputeAttachments
);

// 4. Accept the submitted dispute 
// @route   : PATCH /api/v2/disputes/:disputeId/accept
// @desc    : Accept the submitted dispute by merchant and manager
// @access  : Verified User ( Merchant, Manager )
router.patch(
    '/:disputeId/accept',
    verifyUser,
    disputeController.acceptAnalystSubmittedDispute
);

// 5. Reject the submitted dispute 
// @route   : PATCH /api/v2/disputes/:disputeId/reject
// @desc    : Reject the submitted dispute by merchant and manager
// @access  : Verified User ( Merchant, Manager )
router.patch(
    '/:disputeId/reject',
    verifyMerchantOrManager,
    disputeController.rejectAnalystSubmittedDispute
);

// 6. Fetch Rejected Dispute Feedback
// @route   : GET /api/v2/disputes/:disputeId/reject-feedback
// @desc    : Fetch the rejected feedback of the dispute
// @access  : Verified User ( Merchant, Manager, Analyst )
router.get(
    '/:disputeId/reject-feedback',
    verifyUser,
    disputeController.fetchRejectedDisputeFeedback
);

// 7. Uploaded Drive
// @route    : GET /api/v2/disputes/attachments/drive
// @desc     : Fetch all the disputes Attachment Drive 
// @access   : Verified User ( Merchant, Manager, Analyst )
router.get(
    '/attachments/drive',
    verifyUser,
    disputeController.getUploadedDrive
);


// ******************************** Submitted to Payment Gateway Disputes *****************************

// 1 .Fetching Submitted to Payment Gateway Disputes
// @route  : GET /api/v2/disputes/submitted/gateway
// @desc   : Fetching the Disputes Which are Submitted to the Gateway
// @access : Verified User(Merchant,Manager,Analyst)
router.get(
    '/processed/:status',
    verifyUser,
    managedDisputeController.getProcessedDisputes
)



/// ********************** Get Dispute Review History ************************************************

// 1. Fetching the Dispute History Of the User
//  @route  : GET/ api/v2/disputes/review/history
//  @desc   : Fetching the Dispute Review History
//  @access : Verified User(Merchant,Manager,Analyst)
router.get("/review/history", verifyUser, getDisputesHistory.getDisputesReviewedHistory);



// ****************************** Updated Accepted and Contested Disputes  ************************


// 1. Accepting Process of a Dispute
//  @route   : PATCH /api/v2/disputes/process/:disputeId/accept
//  @desc    : Accepting the Dispute
//  @access  : Verified User(Merchant,Manager,Analyst)
router.patch(
    '/process/:disputeId/accept',
    verifyUser,
    disputeController.acceptDisputeProcess
);

// 2.  Contest process of Dispute
//  @route   : PATCH /api/v2/disputes/process/:disputeId/contest
//  @desc    : Contesting the Dispute
//  @access  : Verified User(Merchant,Manager,Analyst)
router.patch(
    '/process/:disputeId/contest',
    verifyUser,
    disputeController.contestDisputeProcess
)


export default router;