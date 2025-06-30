import express from "express";
import AddMerchantStaff from "../controllers/merchant/staff/add-staff.controller.js";
import { verifyMerchant } from "../middlewares/auth.middleware.js";
import welcomeDashboard from "../controllers/merchant/dashboard/welcome-screen.controller.js";
import updateStaffStatus from "../controllers/merchant/staff/update-staff-status.controller.js";
import staffStatusCards from "../controllers/merchant/staff/staff-status-cards.controller.js";

const router = express.Router();

// ********************************** DashBoard Routes
// 1.Merchant Dashboard Welcome
// @route  : GET /api/v2/merchant/dashboard/welcome
// @desc   : Display Merchant Dashboard after Register
// @access : Private to merchant Only !

router.get("/dashboard/welcome", verifyMerchant, welcomeDashboard);

// *********************************** Staff Routes

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

router.put('/staff/:staffId', verifyMerchant, updateStaffStatus);


// 3 . Fetch Status Cards
// @route  : GET / api/v2/merchant/staff/status
// @desc   : Fetching all the Status Count
// @access : Private to Merchant Only

router.get('/staff/status', verifyMerchant, staffStatusCards);


export default router;
