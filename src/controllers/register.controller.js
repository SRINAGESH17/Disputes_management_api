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