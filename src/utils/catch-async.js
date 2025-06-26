/**
 * Wraps an asynchronous controller function and catches any errors, passing them to the error handler.
 * If an error occurs, sends a standardized failed response with the error status and message.
 *
 * @function
 * @param {Function} controller - The async controller function to wrap. Should accept (req, res, next).
 * @returns {Function} Express middleware function that handles errors from the controller.
 *
 * @example
 * router.get('/endpoint', catchAsync(async (req, res, next) => {
 *   // controller logic
 * }));
 */
import { failed_response } from "./response.js";

const catchAsync =
    (controller) =>
        async (req, res, next) => {
            try {
                await controller(req, res, next);
            } catch (error) {
                const message = error?.message || "Internal Server Error 500";
                return res
                    .status(error.status || 500)
                    .json(
                        failed_response(
                            error.status || 500,
                            message,
                            { message },
                            false
                        )
                    );
            }
        };
export default catchAsync;
