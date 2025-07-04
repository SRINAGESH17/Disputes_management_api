import express from "express";
import AddMerchantStaff from "../controllers/merchant/staff/add-staff.controller.js";
import gatewayController from '../controllers/merchant/integration/gateway.controller.js';
import { verifyMerchant } from "../middlewares/auth.middleware.js";
import welcomeDashboard from "../controllers/merchant/dashboard/welcome-screen.controller.js";
import updateStaffStatus from "../controllers/merchant/staff/update-staff-status.controller.js";
import staffStatusCards from "../controllers/merchant/staff/staff-status-cards.controller.js";
import getAllStaff from "../controllers/merchant/staff/get-all-staff.controller.js";
import getStaff from "../controllers/merchant/staff/get-staff.controller.js";
import merchantProfile from "../controllers/merchant/dashboard/merchant-profile.controller.js";

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
  verifyMerchant, // To Verify Merchant
  AddMerchantStaff // Add Merchant Staff Controller
);

// 2. Change Staff Status
// @route  : PUT /api/v2/merchant/staff/:staffId
// @desc   : Changing Staff Status
// @access : Private to Merchant Only

router.put("/staff/status/:staffId", verifyMerchant, updateStaffStatus);

// 3 . Fetch Status Cards
// @route  : GET / api/v2/merchant/staff/status
// @desc   : Fetching all the Status Count
// @access : Private to Merchant Only

router.get("/staff/status", verifyMerchant, staffStatusCards);

// 4. Fetch all Staff and Filtering
// @route    : GET/api/v2/merchant/staff/all
// @desc     : Fetching all the Staff and Filtering
// @access   : Private to Merchant Only

router.get("/staff/all", verifyMerchant, getAllStaff);

// 5 . Fetching the Staff
// @route   : GET /api/v2/merchant/staff/:staffId
// @desc    : Fetching the Staff Based on Staff Id
// @access  : Private to Merchant Only

router.get("/staff/:staffId", verifyMerchant, getStaff);



// **************************** Gateway oR Integration *****************************/
// 2. Add Gateway
// @route : POST /api/v2/merchant/integration/gateway
// @desc  : Add Gateway for Merchant
// @access: Private to Merchant
router.post('/integration/gateway', verifyMerchant, gatewayController.addGateway)

// 3. fetch Gateways
// @route : GET /api/v2/merchant/integration/gateway
// @desc  : Fetch Gateway for Merchant
// @access: Private to Merchant
router.get('/integration/gateway', verifyMerchant, gatewayController.fetchGateways);





export default router;
