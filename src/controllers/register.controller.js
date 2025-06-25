/**
 * Controller to handle merchant registration.
 *
 * @function registerMerchant
 * @async
 * @description
 * Handles the creation of a new merchant account on the platform.
 * 
 * **Steps:**
 * 1. Extracts merchant registration fields (`name`, `email`, `mobileNumber`, `password`) from the request body.
 * 2. Validates the extracted data using a Yup schema via the `schemaValidator` utility.
 * 3. If validation passes, calls the external `merchantRegisterService` to create the merchant account.
 * 4. Returns a success response with the created merchant payload.
 * 5. Handles and responds to any errors during the process.
 *
 * @param {import('express').Request} req - Express request object containing merchant registration data.
 * @param {import('express').Response} res - Express response object used to send the response.
 * @returns {Promise<import('express').Response>} JSON response indicating success or failure.
 *
 * @external merchantRegisterService
 * @see {@link ../services/merchant/merchantRegister.service.js}
 *
 * @external schemaValidator
 * @see {@link ../utils/schemaValidator.js}
 */


import catchAsync from "../utils/catchAsync.js";
import statusCodes from "../constants/httpStatusCodes.js";
import { failed_response, success_response } from "../utils/response.js";
import schemaValidator from "../utils/schemaValidator.js";
import { merchantRegisterSchema } from "../utils/yupSchema.js";
import merchantRegisterService from "../services/merchant/merchantRegister.service.js";


const registerMerchant = catchAsync(async (req, res) => {
    // Desc : Create Merchant Account into the platform
    try {
        // Step  1: Extract the data fields from request 
        const data = {
            name: req.body?.name,
            email: req.body?.email,
            mobileNumber: req.body?.mobileNumber,
            password: req.body?.password,
        }
        // Validate the merchant valid fields
        if (await schemaValidator(merchantRegisterSchema, data, res)) {
            return res;
        }

        // Step  2: Call the merchant registration service
        const payload = await merchantRegisterService(data);


        // Step  3: create a response payload and return
        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "Merchant Account Created!",
                { ...payload },
                true
            )
        )
    } catch (error) {
        console.log("Error in merchant register controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to register Merchant",
                    {
                        message: error?.message || "Merchant registration failed",
                    },
                    false
                )
            );
    }
});

export default registerMerchant;