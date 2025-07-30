import express from "express";
import AddMerchantStaff from "../controllers/merchant/staff/add-staff.controller.js";
import gatewayController from '../controllers/merchant/integration/gateway.controller.js';
import { verifyMerchant } from "../middlewares/auth.middleware.js";
import welcomeDashboard from "../controllers/merchant/dashboard/welcome-screen.controller.js";
import merchantProfile from "../controllers/merchant/dashboard/merchant-profile.controller.js";
import businessController from "../controllers/merchant/kyb/business.controller.js";
import staffController from '../controllers/merchant/staff/staff.controller.js';
import merchantDisputeController from "../controllers/merchant/merchant-disputes.controller.js";

const router = express.Router();

// ********************************** Dashboard Routes ****************************************
// 1.Merchant Dashboard Welcome
// @route  : GET /api/v2/merchant/dashboard/welcome
// @desc   : Display Merchant Dashboard after Register
// @access : Private to merchant Only !
//
router.get("/dashboard/welcome", verifyMerchant, welcomeDashboard);

// 2.Merchant Profile page
// @route  :GET /api/v2/merchant/profile
// @desc   : Displaying the Merchant Profile
// @access : Private to Merchant Only

router.get("/profile", verifyMerchant, merchantProfile);

// *********************************** Staff Routes ************************************************

// 1. Create Staff Account
// @route : POST /api/v2/merchant/staff/:merchantId
// @desc  : Add Merchant staff
// @access: Private to merchant Only
router.post(
  "/staff/:merchantId",
  // verifyMerchant, // To Verify Merchant
  AddMerchantStaff // Add Merchant Staff Controller
);

// 2. Change Staff Status
// @route  : PUT /api/v2/merchant/staff/:staffId
// @desc   : Changing Staff Status
// @access : Private to Merchant Only

router.put("/staff/status/:staffId", verifyMerchant, staffController.staffStatusUpdate);

// 3 . Fetch Status Cards
// @route  : GET / api/v2/merchant/staff/status
// @desc   : Fetching all the Status Count
// @access : Private to Merchant Only

router.get("/staff/status", verifyMerchant, staffController.getStaffStatusCards);

// 4. Fetch all Staff and Filtering
// @route    : GET/api/v2/merchant/staff/all
// @desc     : Fetching all the Staff and Filtering
// @access   : Private to Merchant Only

router.get("/staff/all", verifyMerchant, staffController.getAllStaff);

// 5 . Fetching the Staff
// @route   : GET /api/v2/merchant/staff/:staffId
// @desc    : Fetching the Staff Based on Staff Id
// @access  : Private to Merchant Only

router.get("/staff/:staffId", verifyMerchant, staffController.getStaff);



// **************************** Gateway and Integration *****************************/
// 1. Add Gateway
// @route : POST /api/v2/merchant/integration/gateway
// @desc  : Add Gateway for Merchant
// @access: Private to Merchant
router.post('/integration/gateway', verifyMerchant, gatewayController.addGateway)

// 2. fetch Gateways
// @route : GET /api/v2/merchant/integration/gateway
// @desc  : Fetch Gateway for Merchant
// @access: Private to Merchant
router.get('/integration/gateway', verifyMerchant, gatewayController.fetchGateways);


// 3. fetch Dispute logs of merchant
// @route : GET /api/v2/merchant/integration/logs
// @desc  : Fetch Dispute logs for Merchant
// @access: Private to Merchant
router.get('/integration/logs', verifyMerchant, gatewayController.fetchDisputeLogs);



//*************************************** KYB ( Know Your Business ) *********************************************************/

// 1. Add Business Account By Verifying GSTIN
// @route : POST /api/v2/merchant/kyb/gst
// @desc  : Add Business Account by GSTIN Verify
// @access: Private to Merchant
router.post(
  '/kyb/gst',
  verifyMerchant,
  businessController.addNewBusinessAccount
);

// 2. Fetch Merchant Business Accounts
// @route : GET /api/v2/merchant/kyb/gst-all
// @desc  : Fetch Business Accounts 
// @access: Private to Merchant
router.get(
  '/kyb/gst-all',
  verifyMerchant,
  businessController.fetchMerchantBusinessAccounts
);

// *********************************************** Merchant Disputes ********************************************************/

// 1.Fetch Internal Dispute States
// @route  : GET /api/v2/merchant/disputes/states
// @desc   : Fetch Internal Disputes States
// @access : Private to merchant Only !
router.get(
  '/disputes/states',
  verifyMerchant,
  merchantDisputeController.getDisputeStates
);

// 2.Fetch Disputes List With Filters
// @route  : GET /api/v2/merchant/disputes/list
// @desc   : Fetch Disputes List with filters
// @access : Private to merchant Only !
router.get(
  '/disputes/list',
  verifyMerchant,
  merchantDisputeController.getDisputesList
);

// 3. Fetch Disputes Reviews With Filters
// @route  : GET /api/v2/merchant/disputes/reviews
// @desc   : Fetch Disputes Reviews with filters
// @access : Private to merchant Only !
router.get(
  '/disputes/reviews',
  verifyMerchant,
  merchantDisputeController.getDisputesReviews
);

// 4. Fetch Disputes Submitted by Manager With Filters
// @route  : GET /api/v2/merchant/disputes/manager/submitted
// @desc   : Fetch Disputes Submitted by Manager with filters
// @access : Private to merchant Only !
router.get(
  '/disputes/manager/submitted',
  verifyMerchant,
  merchantDisputeController.getDisputesSubmittedByManager
);


// 5. Fetch Disputes Submitted Analyst By Stage With Filters
// @route  : GET /api/v2/merchant/disputes/analyst/:stage
// @desc   : Fetch Disputes Submitted Analyst by Stage with filters
// @access : Private to merchant Only !
router.get(
  '/disputes/analyst/:stage',
  verifyMerchant,
  merchantDisputeController.getDisputesSubmittedAnalystByStage
);

// 6. Fetch Disputes Reviewed History for Merchant
// @route  : GET /api/v2/merchant/disputes/reviewed/history
// @desc   : Fetch reviewed disputes history for the merchant with optional filters
// @access : Private to merchant only
router.get(
  '/disputes/reviewed/history',
  verifyMerchant,
  merchantDisputeController.getDisputesReviewedHistory
);


// 7. Update Dispute Submit to Payment Gateway
// @route  : GET /api/v2/merchant/dispute/submit/payment-gateway
// @desc   : Update Dispute Submit to Payment Gateway
// @access : Private to merchant Only !
router.put(
  '/dispute/:disputeId/submit/payment-gateway',
  verifyMerchant,
  merchantDisputeController.updateDisputeSubmitToPaymentGateway
);



// 3. Fetch Disputes Reviews With Filters
// @route  : GET /api/v2/merchant/disputes/reviews
// @desc   : Fetch Disputes Reviews with filters
// @access : Private to merchant Only !
router.get(
  '/disputes/reviews',
  verifyMerchant,
  merchantDisputeController.getDisputesReviews
);

// 4. Fetch Disputes Submitted by Manager With Filters
// @route  : GET /api/v2/merchant/disputes/manager/submitted
// @desc   : Fetch Disputes Submitted by Manager with filters
// @access : Private to merchant Only !
router.get(
  '/disputes/manager/submitted',
  verifyMerchant,
  merchantDisputeController.getDisputesSubmittedByManager
);


// 5. Fetch Disputes Submitted Analyst By Stage With Filters
// @route  : GET /api/v2/merchant/disputes/analyst/:stage
// @desc   : Fetch Disputes Submitted Analyst by Stage with filters
// @access : Private to merchant Only !
router.get(
  '/disputes/analyst/:stage',
  verifyMerchant,
  merchantDisputeController.getDisputesSubmittedAnalystByStage
);

// 6. Fetch Disputes Reviewed History for Merchant
// @route  : GET /api/v2/merchant/disputes/reviewed/history
// @desc   : Fetch reviewed disputes history for the merchant with optional filters
// @access : Private to merchant only
router.get(
  '/disputes/reviewed/history',
  verifyMerchant,
  merchantDisputeController.getDisputesReviewedHistory
);


// 7. Update Dispute Submit to Payment Gateway
// @route  : GET /api/v2/merchant/dispute/submit/payment-gateway
// @desc   : Update Dispute Submit to Payment Gateway
// @access : Private to merchant Only !
router.put(
  '/dispute/:disputeId/submit/payment-gateway',
  verifyMerchant,
  merchantDisputeController.updateDisputeSubmitToPaymentGateway
);


export default router;
