/**
 * Controller to fetch dispute data based on a custom dispute ID.
 *
 * @function
 * @async
 * @param {import('express').Request} req - Express request object, expects `disputeId` in `req.params`.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON response with the dispute data or an error message.
 *
 * @throws {AppError} If the disputeId is missing, invalid, or if fetching the dispute fails.
 *
 * @description
 * Steps performed:
 * 1. Extracts `disputeId` from request parameters.
 * 2. Validates that `disputeId` is provided and has the correct format (length 15 and prefix "DIS").
 * 3. Fetches dispute data from the database using the custom dispute ID.
 * 4. Returns the dispute data in a success response, or an error response if any step fails.
 */

import Dispute from "../../../models/dispute.model.js";
import _ from 'lodash';
import catchAsync from "../../../utils/catch-async.js";
import AppError from "../../../utils/app-error.js";
import AppErrorCode from "../../../constants/app-error-codes.js";
import statusCodes from "../../../constants/status-codes.js";
import { success_response, failed_response } from "../../../utils/response.js";


const getDisputeData = catchAsync(async (req, res) => {
    // @desc Fetching the Dispute Data
    try {

        // Step 1: Extracting the Custom DisputeId From params
        const { disputeId } = req.params;

        // Step 2:  Validating is disputeId is Coming from the params
        if (_.isEmpty(disputeId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("disputeId"));
        }

        // Step 3: validating the disputeId length and prefix
        if (disputeId.length !== 15 && disputeId.slice(0, 3) !== "DIS") {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("disputeId"));
        }

        // Step 4: Fetching the Dispute Data From the Custom DisputeId
        const dispute = await Dispute.findOne(
            {
                where: { customId: disputeId },
                attributes: ["customId", "disputeId", "paymentId", "gateway", "state", "amount", "status", "createdAt", "dueDate"], raw: true
            }
        );


        // Step 5:Sending the Response of the Fetched Dispute 

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetched Dispute",
                { ...dispute },
                true
            )
        )

    } catch (error) {
        console.log(error?.message || "Failed to Fetch Dispute Data");
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch Dispute Data",
                {
                    message: error?.message || "Fetching Dispute Data Failed"
                },
                false
            )
        )
    }
});

export default getDisputeData;