import _ from "lodash";
import statusCodes from "../../../constants/status-codes.constant.js";
import catchAsync from "../../../utils/catch-async.util.js";
import { failed_response, success_response } from "../../../utils/response.util.js";
import AppError from "../../../utils/app-error.util.js";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import { uniqueBusinessId } from "../../../utils/generate-ids.util.js";
import Business from "../../../models/business.model.js";
import Analyst from "../../../models/analyst.model.js";
import Manager from "../../../models/manager.model.js";
import StaffBusinessMap from "../../../models/staff-business-map.model.js";
import { Op } from "sequelize";



// Validate GSTIN Format
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

// console.log(isValidGSTINFormat("27AAPFU0939F1ZV"));
// console.log(isValidGSTINFormat("29ABCDE1234F1Z5"));
// console.log(isValidGSTINFormat("36AANCP2226M1Z2"));
// console.log(isValidGSTINFormat("36ABACS8072J1Z0"));

function getRandomCompanyName() {
    const companies = [
        "Skygoal Innova Technologies Private Limited",
        "Payinstacard Private Limited",
        "PhonePe Private Limited",
        "TechNova Solutions Pvt Ltd",
        "BluePeak Systems LLP",
        "GreenLeaf Enterprises",
        "QuantumSoft Technologies",
        "Microsoft Technologies",
        "Deloitte Group of Technologies",
        "Google Private Limited",
        "Amazon Group Of Services",
        "Brainwave Labs Private Limited",
        "DigioSquad Private Limited",
        "Global IT Services",
        'Sattva IT Solutions'
    ];
    const randomIndex = Math.floor(Math.random() * companies.length);
    return companies[randomIndex];
}

// @desc 1. Merchant GSTIN Verification Controller
const addNewBusinessAccount = catchAsync(async (req, res) => {
    // @route : POST /api/v2/merchant/gstin/verify
    // @access: Private to Merchant Only
    try {

        // Step 1 : Extract gstin from the request
        const { phone_number: mobileNumber } = req.currUser;
        const { userId, merchant, firebaseId } = req.userRole;
        const { gstin } = req.body;

        // Step 2 : validate gstin and merchantId
        // 2.1 : Validate merchantId

        // 2.1 : Validate Merchant id
        if (_.isEmpty(userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('merchantId'));
        }

        if (!mobileNumber) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.YouAreNotAuthorized);
        }
        if (!merchant) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.YouAreNotAuthorized);
        }
        if (!firebaseId) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.YouAreNotAuthorized);
        }
        // 2.2 Validate GSTIN 
        if (_.isEmpty(gstin)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('gstin'));
        }
        if (!isValidGSTINFormat(gstin)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('GSTIN'));
        }

        console.log('gstin : ', gstin);
        // Step 3 : Validate gstin already register or not
        const gstinAccount = await Business.findOne({ where: { gstin }, attributes: ['id', 'merchantId'], raw: true });
        if (!_.isEmpty(gstinAccount)) {
            if (gstinAccount?.merchantId === userId) {
                throw new AppError(statusCodes.CONFLICT, 'This GSTIN Is Already Registered By You!');
            }
            throw new AppError(statusCodes.BAD_REQUEST, 'This GSTIN Is Already Registered By Another Merchant');
        }
        console.log("After fetching business account: ", gstinAccount);

        //* Step 4 : Verify GSTIN by Third Party Service
        
        // Step 5 : Generate Payload for business account
        const mobileDigits = mobileNumber.slice(-4);

        // Generate custom business Id
        const customBusinessId = uniqueBusinessId(mobileDigits);
        console.log('customBusinessId:', customBusinessId);
        console.log('🚨 ATTRIBUTES:', Object.keys(Business.rawAttributes));
        console.log('🚨 TABLE ATTRIBUTES:', Object.keys(Business.tableAttributes));

        const businessPayload = {
            merchantId: userId,
            firebaseId,
            customBusinessId,
            gstin,
            businessName: getRandomCompanyName()
        }

        const [businessAccount, analysts, managers] = await Promise.all([
            // Step 6 : Create Merchant Business Account
            Business.create(businessPayload),

            // Fetch Analysts
            Analyst.findAll({ where: { merchantId: userId }, attributes: ['id', 'firebaseId', 'staffRole', 'selectedBusinessId'], raw: true }),

            // Fetch Managers to Map Business Account
            Manager.findAll({ where: { merchantId: userId }, attributes: ['id', 'firebaseId', 'staffRole', 'selectedBusinessId'], raw: true })
        ]);
        console.log("business: ", businessAccount);

        if (_.isEmpty(businessAccount)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Business Account'))
        }


        // Step 7 : Check If Staff(Analyst or Manager) Exist then Create their business mapping to this business Account
        const staff = [...analysts, ...managers];
        console.log("staff : ", staff);
        if (staff.length > 0) {
            const staffBusinessMapPayload = staff?.map((member) => ({
                staffId: member?.id,
                staffRef: member?.staffRole?.toUpperCase(),
                merchantId: userId,
                businessId: businessAccount.id,
                firebaseId: member?.firebaseId
            }));

            console.log("staff business payload : ", staffBusinessMapPayload);
            const data = await StaffBusinessMap.bulkCreate(staffBusinessMapPayload);
            console.log("After creating :", data);
        }

        // Attach created business account to Staff , who don't have selected business
        const analystIds = analysts?.filter((analyst) => !analyst?.selectedBusinessId)?.map((analyst) => analyst?.id);
        const managerIds = managers?.filter((manager) => !manager?.selectedBusinessId)?.map((manager) => manager?.id);

        // Set business as default for the staff if not added
        if (analystIds.length > 0) {
            await Analyst.update(
                { selectedBusinessId: businessAccount.id },
                { where: { id: { [Op.in]: analystIds } } }
            );
        }
        if (managerIds.length > 0) {
            await Manager.update(
                { selectedBusinessId: businessAccount.id },
                { where: { id: { [Op.in]: managerIds } } }
            );
        }

        // Step 8 : Return Payload


        return res.status(statusCodes.CREATED)
            .json(
                success_response(
                    statusCodes.CREATED,
                    "Business Account Verified Successfully",
                    {
                        message: "GSTIN Verified Successfully",
                        businessAccount
                    },
                    true
                )
            )

    } catch (error) {
        console.log("Error in Merchant GSTIN Verification controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to Verify Merchant Business GSTIN",
                    {
                        message: error?.message || "Merchant Business GSTIN Verification Failed",
                    },
                    false
                )
            );
    }
});

// @desc 2. Fetch Merchant Business Accounts
const fetchMerchantBusinessAccounts = catchAsync(async (req, res) => {
    // @route : GET /api/v2/merchant/kyb/gst-all
    try {
        // Step-1 Destructuring currUser and userRole from request
        const { currUser, userRole } = req;
        
        // Step-2 Validate currUser and userRole are authorization
        if (!currUser && !userRole?.merchant) {
            throw new AppError(statusCodes.UNAUTHORIZED, AppErrorCode.YouAreNotAuthorized);
        }

        // Step-3 fetching all Businesses of merchant with merchant id
        const businesses = await Business.findAll({
            where: { merchantId: userRole.userId },
            attributes: ['businessName', 'customBusinessId', 'gstin', 'gateways'],
            raw: true,
        });

        // Step-4 Throwing error message if business length is Zero
        if (_.isEmpty(businesses)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Businesses'));
        }

        // Step-5 Sending success response
        return res.status(200).json(
            success_response(
                statusCodes.OK,
                "Fetched Merchant Business Accounts Successfully",
                {
                    message: "Business Accounts Successfully",
                    businesses
                },
                true
            ))
    } catch (error) {
        console.log("Error in Fetch Merchant Business Accounts controller : ", error?.message);
        // Step-6 Sending Error response
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
            .json(
                failed_response(
                    error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to Fetch Merchant Business Accounts",
                    {
                        message: error?.message || "Fetch Merchant Business Accounts Failed",
                    },
                    false
                )
            );
    }
});


const businessController = {
    addNewBusinessAccount,
    fetchMerchantBusinessAccounts
}

export default businessController;