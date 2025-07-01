
/**
 * Controller to handle user password reset requests.
 *
 * @function resetUserPassword
 * @async
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response>} Returns a response with the result of the password reset operation.
 *
 * @description
 * 1. Extracts the user's email from request parameters and new password/referenceId from the request body.
 * 2. Validates the payload using a schema validator.
 * 3. Calls the reset password service to update the user's password.
 * 4. Returns a success response if the operation is successful, otherwise returns an error response.
 *
 * @throws {Error} If any error occurs during the password reset process, returns an error response with details.
 */
import statusCodes from "../constants/status-codes.js";
import resetPasswordService from "../services/reset-password.service.js";
import catchAsync from "../utils/catch-async.js";
import { failed_response, success_response } from "../utils/response.js";
import schemaValidator from "../utils/schema-validator.js";
import { resetPasswordSchema } from "../utils/yup-schema.js";

const resetUserPassword = catchAsync(async (req, res) => {
    // Desc : Reset Password For User
    try {
        // Step  1: Extract the data fields from request 
        const { email } = req.params;
        const data = {
            newPassword: req.body?.newPassword,
            referenceId: req.body?.referenceId,
            email
        }
        // Validate reset Password Payload
        if (await schemaValidator(resetPasswordSchema, data, res)) {
            return res;
        }

        // Step  2: Call the reset password service
        const payload = await resetPasswordService(data);


        // Step  3: create a response payload and return
        return res.status(statusCodes.ACCEPTED).json(
            success_response(
                statusCodes.ACCEPTED,
                "User Password Reset Successfully!",
                { ...payload },
                true
            )
        )
    } catch (error) {
        console.log("Error in user reset password controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to reset user password",
                    {
                        message: error?.message || "Reset Password Failed",
                    },
                    false
                )
            );
    }
});

export default resetUserPassword;