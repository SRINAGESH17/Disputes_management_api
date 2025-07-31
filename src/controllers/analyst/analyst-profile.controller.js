import statusCodes from "../../constants/status-codes.constant.js";
import catchAsync from "../../utils/catch-async.util.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import AppError from "../../utils/app-error.util.js";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import Merchant from "../../models/merchant.model.js";
import Analyst from "../../models/analyst.model.js";

// @desc 1. Fetch Analyst Profile and Associated Merchant Name
const getAnalystProfile = catchAsync(async (req, res) => {
  // @route GET /api/v2/analyst/profile
  try {
    // Step-1: Destructure current user and role from request
    const { currUser, userRole } = req;

    // Step-2: Validate that the user is authenticated and authorized as a merchant
    if (!currUser && !userRole.analyst) {
      throw new AppError(
        statusCodes.UNAUTHORIZED,
        AppErrorCode.YouAreNotAuthorized
      );
    }

    // Step-3: Fetch analyst profile including merchant name via association
    const profile = await Analyst.findOne({
      where: { id: currUser.userId },
      attributes: [
        "id",
        "firstName",
        "lastName",
        "staffRole",
        "mobileNumber",
        "email",
        "merchantId",
        "createdAt",
        "status"
      ],
      include: [
        {
          model: Merchant,
          attributes: ["name"],
          as: "merchant" // Make sure alias matches the association in your model definition
        },
      ]
    });

    // Step-4: Handle case when profile is not found
    if (!profile) {
      throw new AppError(
        statusCodes.NOT_FOUND,
        AppErrorCode.DataNotFound("Analyst profile")
      );
    }

    // Step-5: Prepare transformed response object
    const analyst = {
      id: profile.id,
      fullName: `${profile.firstName} ${profile.lastName}`,
      role: profile.staffRole,
      email: profile.email,
      mobileNumber: profile.mobileNumber,
      createdAt: profile.createdAt,
      status: profile.status,
      merchant: profile.merchant?.name || "N/A"
    };

    // Step-6: Send success response with analyst profile
    return res.status(statusCodes.OK).json(
      success_response(
        statusCodes.OK,
        "Analyst Profile fetched Successfully",
        analyst,
        true
      )
    );

  } catch (error) {
    // Step-7: Catch and return any errors during processing
    console.error("Error in fetching analyst profile:", error?.message);
    return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
      failed_response(
        error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
        "Failed To Fetch Analyst Profile",
        {
          message: error?.message || "Analyst Profile Fetching Failed",
        },
        false
      )
    );
  }
});

const analystProfileController = {
  getAnalystProfile
}

export default analystProfileController;