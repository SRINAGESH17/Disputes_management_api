import _ from "lodash";
import statusCodes from "../../constants/httpStatusCodes.js";
import catchAsync from "../../utils/catchAsync.js";
import { failed_response, success_response } from "../../utils/response.js";
import AppError from "../../utils/AppError.js";
import AppErrorCode from "../../constants/AppErrorCodes.js";


function isValidGSTINFormat(gstin) {
    // @desc : Validate GSTIN Format
    // @param: gstin - GSTIN string to validate
    // @return: boolean - true if valid GSTIN format, false otherwise


    // GSTIN should be 15 characters long, starting with 2 digits, followed by 5 uppercase letters, 4 digits, 1 uppercase letter, 1 alphanumeric character, 'Z', and 1 alphanumeric character.
    // EX : 29ABCDE1234F1Z5, 27AAPFU0939F1ZV --> `27AAPFU0939F1ZV` is a valid GSTIN format

    // Note: GSTIN is a 15-character alphanumeric string that follows a specific format;
    // Each GSTIN consists of:
    // 1. First 2 characters: state code (2 digits) ( 01 to 37 or 97 to 99 )
    // 2. Next 5 characters: PAN of the business (5 uppercase letters)
    // 3. Next 4 characters: PAN numeric Entity code (4 digits)
    // 4. Next character: PAN Alphabetic character (1 uppercase letter)
    // 5. Next character: Alphanumeric character (1 digit or uppercase letter)
    // 6. Last character: 'Z' followed by a checksum digit (1 digit or uppercase letter)

    // Regular expression to validate GSTIN format
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return regex.test(gstin);
}
console.log(isValidGSTINFormat("27AAPFU0939F1ZV"));
console.log(isValidGSTINFormat("29ABCDE1234F1Z5"));
console.log(isValidGSTINFormat("36AANCP2226M1Z2"));
console.log(isValidGSTINFormat("36ABACS8072J1Z0"));

const VerifyMerchantGSTIN = catchAsync(async (req, res) => {
    // @desc  : Merchant GSTIN Verification Controller
    // @route : POST /api/v2/merchant/gstin/verify
    // @access: Private to Merchant Only
    try {

        // Step 1 : Extract the Staff Details and Merchant Id from request
        const { userId, merchant } = req.userRole;
        const { gstin } = req.body;

        // Step 2 : Validate the GSTIN and Valid MerchantId

        // 2.1 : Validate Merchant id
        if (_.isEmpty(userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('merchantId'));
        }

        if (!merchant) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.YouAreNotAuthorized);
        }

        // 2.2 : Validate GSTIN format
        if (_.isEmpty(gstin)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('merchantId'));
        }
        if (!isValidGSTINFormat(gstin)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('GSTIN'));
        }
        // Step 3 : Verify the GSTIN
        // const gstinVerificationResponse = await verifyMerchantGSTINService({
        //     userId,
        //     gstin,
        // });

        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "Merchant GSTIN Verified Successfully.",
                {},
                true
            )
        )
    } catch (error) {
        console.log("Error in Merchant GSTIN Verification controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to Verify Merchant GSTIN",
                    {
                        message: error?.message || "Merchant GSTIN Verification Failed",
                    },
                    false
                )
            );
    }
});

export default VerifyMerchantGSTIN;