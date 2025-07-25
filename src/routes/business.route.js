import express from "express";
import { verifyUser } from "../middlewares/auth.middleware.js";
import businessAccountController from "../controllers/business-account.controller.js";

const router = express.Router();



// Fetch the Logged in User Business Accessible Accounts
// @route    : GET  /api/v2/businesses/mine
// @desc     : Fetch User Logged Business Accounts
// @access   : Verified User ( Merchant, Manager, Analyst )
router.get(
    '/mine',
    verifyUser,
    businessAccountController.fetchUserBusinessAccountsAccess
);

// Update The Business Account Into User Profile To Fetch Respective Feed
// @route    : PATCH  /api/v2/businesses/mine/select
// @desc : Store The Selected Business Account To Fetch Respective Dashboard Feed 
// @access   : Verified User ( Merchant, Manager, Analyst )
router.patch(
    '/mine/select',
    verifyUser,
    businessAccountController.updateTheSelectedBusinessAccount
);

export default router;