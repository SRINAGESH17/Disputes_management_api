import _ from "lodash";
import statusCodes from "../../../constants/status-codes.js";
import catchAsync from "../../../utils/catch-async.js";
import { failed_response, success_response } from "../../../utils/response.js";
import AppError from "../../../utils/app-error.js";
import AppErrorCode from "../../../constants/app-error-codes.js";


const AddGateway = catchAsync(async (req, res, next) => {
    const { merchantId } = req.params;
    const { gatewayName, gatewayConfig } = req.body;

    console.log('AddGateway controller called');
    console.log("Adding gateway for merchant:", merchantId);
    console.log("GatewayName:", gatewayName);
    console.log("gatewayConfig:", gatewayConfig);

    res.json({
        message: "Gateway added successfully",     
        merchantId,
        gatewayName,    
        gatewayConfig
    });

    // // Validate input
    // if (!merchantId || !gatewayName || !gatewayConfig) {
    //     return next(new AppError(AppErrorCode.INVALID_INPUT, statusCodes.BAD_REQUEST));
    // }

    // // Simulate adding gateway logic (e.g., saving to database)
    // // This is where you would typically interact with your database or service layer

    // // For demonstration, let's assume the gateway was added successfully
    // const newGateway = {
    //     id: _.uniqueId('gateway_'),
    //     merchantId,
    //     gatewayName,
    //     gatewayConfig,
    //     createdAt: new Date(),
    // };

    // // Respond with success
    // return success_response(res, statusCodes.CREATED, "Gateway added successfully", newGateway);
}
);


export default AddGateway;