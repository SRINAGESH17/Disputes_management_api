import _ from "lodash";
import statusCodes from "../../constants/httpStatusCodes.js";
import catchAsync from "../../utils/catchAsync.js";
import { failed_response, success_response } from "../../utils/response.js";
import schemaValidator from "../../utils/schemaValidator.js";
import { addingStaffSchema } from "../../utils/yupSchema.js";
import AppError from "../../utils/AppError.js";
import AppErrorCode from "../../constants/AppErrorCodes.js";
import AddMerchantStaffService from "../../services/merchant/AddStaffService.js";




const AddMerchantStaff = catchAsync(async (req, res) => {
    // @desc  :  Merchant Adding Staff Member 
    try {

        // Step 1 : Extract the Staff Details and Merchant Id from request
        const { merchantId } = req.params;
        const { firstName, lastName, email, password, mobileNumber, designation } = req.body;


        // Step 2 : Validate the Staff Details and valid MerchantId 
        // 2.1 : Validate Merchant id
        if (_.isEmpty(merchantId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('merchantId'));
        }
        // Validating user with mobile number with email format 
        // 2.2 : Validate staff details
        const data = {
            firstName,
            lastName,
            email,
            mobileNumber,
            designation,
            password
        }
        if (await schemaValidator(addingStaffSchema, data, res)) {
            return res;
        }

        // Step 3 : Call the Add Staff Service 
        const payload = await AddMerchantStaffService({
            ...data,
            merchantId
        });
        // Step 4 : return the response payload

        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "Staff Account Added Successfully",
                { ...payload },
                true
            )
        )
    } catch (error) {
        console.log("Error in Add Merchant Staff controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to Add Staff",
                    {
                        message: error?.message || "Adding Staff Failed",
                    },
                    false
                )
            );
    }
});

export default AddMerchantStaff;