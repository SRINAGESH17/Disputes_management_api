/**
 * Validates the provided data against a Yup schema and handles validation errors.
 *
 * @async
 * @function schemaValidator
 * @param {yup.ObjectSchema} schema - The Yup schema to validate against.
 * @param {Object} data - The data object to validate.
 * @param {import('express').Response} res - The Express response object used to send error responses.
 * @returns {Promise<boolean>} Returns `false` if validation passes, `true` if validation fails and a response is sent.
 *
 * @throws {yup.ValidationError} Throws if validation fails, but is caught and handled internally.
 *
 * @example
 * const schema = yup.object().shape({ name: yup.string().required() });
 * const isError = await schemaValidator(schema, req.body, res);
 * if (isError) return;
 */
import statusCodes from "../constants/httpStatusCodes.js";
import { failed_response } from "./response.js";
import * as yup from "yup";

const schemaValidator = async (schema, data, res) => {
    try {
        await schema.validate(data, { abortEarly: false });
        return false;
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            console.log("Yup validation error:", error);
            res.status(statusCodes.BAD_REQUEST).json(
                failed_response(
                    statusCodes.BAD_REQUEST,
                    "Validation failed. Please fix and try again.",
                    {
                        status: "Please check the highlighted fields.",
                        message: error?.errors?.[0] || error?.message,
                        errors: error?.errors || []
                    },
                    false
                )
            );
        }
        return true;
    }
    // return false;
};

export default schemaValidator;