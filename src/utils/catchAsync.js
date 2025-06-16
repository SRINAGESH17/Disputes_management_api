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
