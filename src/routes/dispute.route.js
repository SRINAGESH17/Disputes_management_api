import express from 'express';
// import { verifyMerchant } from '../middlewares/auth.middleware.js';
// import merchantDisputeController from '../controllers/disputes/merchant-disputes.controller.js';

const router = express.Router();

// 1.Fetch Internal Dispute States
// @route  : GET /api/v2/disputes/states
// @desc   : Fetch Internal Disputes States
// @access : Private to merchant Only !
// router.get(
//     '/states',
//     verifyMerchant,
//     merchantDisputeController.getDisputeStates
// );

// 2.Fetch Disputes List With Filters
// @route  : GET /api/v2/disputes/list
// @desc   : Fetch Disputes List with filters
// @access : Private to merchant Only !
// router.get(
//     '/list',
//     verifyMerchant,
//     merchantDisputeController.getDisputesList
// );

export default router;