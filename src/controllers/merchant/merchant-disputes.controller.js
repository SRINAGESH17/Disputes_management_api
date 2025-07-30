import _ from "lodash";
import { disputeStatesArray } from "../../constants/dispute-states.constant.js";
import statusCodes from "../../constants/status-codes.constant.js";
import catchAsync from "../../utils/catch-async.util.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import AppError from "../../utils/app-error.util.js";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import { Op } from "sequelize";
import Dispute from "../../models/dispute.model.js";
import Analyst from "../../models/analyst.model.js";
import { GatewayNames } from "../../constants/gateways.constant.js";
import helpers from "../../utils/helpers.util.js";


const isValidDate = (dateStr) => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}



// @desc 1.Fetch Dispute States
const getDisputeStates = catchAsync(async (req, res) => {
  // @description : Fetch Internal Disputes States
  try {

    // Format the states in capitalize Font and separate it if it has more then one word
    const states = disputeStatesArray?.map((state) => state?.toLowerCase()?.split('_')?.map(word => word?.[0]?.toUpperCase() + word?.slice(1)).join(' '));

    return res.status(statusCodes.ACCEPTED).json(
      success_response(
        statusCodes.ACCEPTED,
        "Disputes States Fetch Successfully",
        { dispute_states: states },
        true
      )
    )
  } catch (error) {
    console.log("Error in fetching internal dispute states controller : ", error?.message);
    return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Failed To Fetch Disputes States",
          {
            message: error?.message || "Disputes States Fetching Failed",
          },
          false
        )
      );
  }
});



//2  @desc Fetching all the Dispute List of A Particular Business 
const getDisputesList = catchAsync(async (req, res) => {

  // route  : GET   /api/v2/merchant/list
  try {
    // Step 1 : Extract the filter fields from query and user details from request
    const { currUser, userRole, businessId } = req;
    const { disputeId, paymentId, state, fromDate, toDate, assigned } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Step 2 : Validate filter fields if exist and request user
    // 2.1: Validate User is Merchant or not
    if (_.isEmpty(currUser)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.UnAuthorizedField("User")
      );
    }

    // 2.2 : Checking For the UserId
    if (!currUser?.userId) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.UnAuthorizedField("User")
      );
    }

    // 2.3 Validating the Incoming userId is UUIDV4
    if (currUser?.userId && !helpers.isValidUUIDv4(currUser?.userId)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("userId"))
    }

    // 2.4 : Validating the User is Merchant or Not
    if (!userRole.merchant) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.UnAuthorizedField("merchant")
      );
    }

    // 2.5 validating the Incoming Business Id
    if (_.isEmpty(businessId)) {
      return res.status(statusCodes.OK).json(
        success_response(
          statusCodes.OK,
          "Dispute List Fetched SuccessFully!",
          {
            totalPages: 0,
            totalDisputes: 0,
            limit: 0,
            page: 0,
            disputes: []
          },
          true
        )
      )
    }

    // 2.6 Validating the BusinessId and it should be Valid UUIDV4 Format 
    if (businessId && !helpers.isValidUUIDv4(businessId)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("businessId"));
    }

    // 2.7 : Validate Internal State
    if (state) {
      const disputeState = state?.toUpperCase()?.split(' ')?.join('_');
      if (!disputeStatesArray.includes(disputeState)) {
        throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldValue("state"));
      }
    }

    // 2.8 : Validate fromDate and toDate String fields
    if (fromDate && !isValidDate(fromDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("fromDate", 'Date String'));
    }

    if (toDate && !isValidDate(toDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("toDate", 'Date String'));
    }

    if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("From Date", "To Date"))
    }


    // Step 3 : Generate a filter payload for disputes
    const filters = {
      merchantId: currUser?.userId,
      businessId
    };

    // add Dispute Id filter
    if (disputeId) {
      filters[Op.or] = [
        { disputeId: { [Op.iLike]: `%${disputeId}%` } },
        { customId: { [Op.iLike]: `%${disputeId}%` } },
      ];
    }

    // add paymentId filter
    if (paymentId) {
      filters[Op.or] = [
        ...(filters[Op.or] || []),
        { paymentId: { [Op.iLike]: `%${paymentId}%` } },
      ];
    }

    // add state filter
    if (state) {
      filters[Op.or] = [
        ...(filters[Op.or] || []),
        { state: { [Op.iRegexp]: state } },
      ];
    }
    // add dates in filter
    if (fromDate && toDate) {
      filters.updatedStageAt = {
        [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
      };
    } else if (fromDate) {
      filters.updatedStageAt = {
        [Op.gte]: new Date(fromDate)
      };
    } else if (toDate) {
      filters.updatedStageAt = {
        [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
      };
    }

    // added the Merchant and analyst Disputes Filter
    if (assigned) {
      if (assigned.toLowerCase() === "merchant") {
        filters.analystId = null;
      } else if (assigned.toLowerCase() === "analyst") {
        filters.analystId = { [Op.ne]: null };
      }
    }


    // Step 4 : Fetch the disputes with filters
    const { count: totalDisputes, rows: disputes } = await Dispute.findAndCountAll({
      where: filters,
      attributes:
        ["id", "customId", "paymentId", "amount", "analystId", "dueDate", "gateway", "state", "createdAt", "reason"],
      limit: limit,
      offset: skip,
      order: [["createdAt", "DESC"]],
      raw: true
    });

    // Step 5 : Fetching the Analyst Id and finding the Unique Id 
    const analystDetails = [];
    const disputeAnalysts = disputes.map((dispute) => dispute.analystId);

    const uniqueAnalysts = new Set(disputeAnalysts);

    const analysts = await Analyst.findAll({
      where: {
        id: {
          [Op.in]: Array.from(uniqueAnalysts)
        },

      },
      attributes: ['id', "firstName", "lastName"],
      raw: true
    })

    // Step 6 : Creating an Object of Analyst with the Analyst Id and Name 
    analysts.forEach((analyst) => {
      const analystObj = {}
      if (uniqueAnalysts.has(analyst.id)) {
        analystObj.analystId = analyst.id;
        analystObj.analystName = `${analyst.firstName} ${analyst.lastName}`;
        analystDetails.push(analystObj)
      }
    })

    // Step 7 : Mapping the Dispute with the Name of the Analyst from Above Analyst Details Array 
    const disputesData = disputes.map((dispute) => {
      const disputeStaff = dispute?.analystId ? analystDetails?.find((analyst) => analyst?.analystId === dispute?.analystId) : null;
      const staffName = disputeStaff ? `${disputeStaff?.analystName}` : '';
      return {
        disputeId: dispute?.customId,
        paymentId: dispute?.paymentId,
        analystId: dispute?.analystId,
        staffName,
        amount: dispute?.amount,
        ChargeBackDate: dispute?.createdAt,
        reason: dispute?.reason,
        respondBy: dispute?.dueDate,
        state: dispute?.state,
        gateway: dispute?.gateway,
        type: dispute?.type,
        updatedAt: dispute?.updatedAt,
        currentStage: dispute?.workflowStage
      }
    })


    // Step 8 : Creating a Custom payload To generate the Response
    const payload = {
      totalDisputes,
      totalPages: Math.ceil((totalDisputes || 0) / limit),
      page,
      limit,
      disputes: disputesData
    }


    // Step 9 : Returning the Customized Payload 
    return res.status(statusCodes.OK).json(
      success_response(
        statusCodes.OK,
        "Dispute List Fetched Successfully!",
        {
          payload
        },
        true
      )
    )

  } catch (error) {
    console.log("Error in fetching disputes controller : ", error?.message);
    return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Failed To Fetch Disputes List",
          {
            message: error?.message || "Disputes List Fetching Failed",
          },
          false
        )
      );
  }
});

// @desc 3. Fetch Merchant Disputes Reviews
const getDisputesReviews = catchAsync(async (req, res) => {
  // @route GET /api/v2/merchant/disputes/reviews
  try {
    // step-1 Destructuring currUser and userRole from request
    const { currUser, userRole, businessId } = req;
    const { fromDate, toDate, gateway, search } = req.query

    // step-2 Validate merchant selected active business account
    if (!businessId) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.validFieldIsRequired('Business account')
      );
    }

    // Validate currUser and userRole are authorization
    if (!currUser && !userRole.merchant) {
      throw new AppError(
        statusCodes.UNAUTHORIZED,
        AppErrorCode.YouAreNotAuthorized
      );
    }

    // step-3 Where condition payload
    const whereCondition = {
      businessId: businessId,
      workflowStage: { [Op.ne]: "PENDING" },
    };

    // Validate fromDate and toDate
    if (fromDate && !isValidDate(fromDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date"));
    }

    if (toDate && !isValidDate(toDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date"));
    }

    if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("To Date", "From Date",));
    }

    if (fromDate && toDate) {
      whereCondition.updatedAt = {
        [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
      };
    } else if (fromDate) {
      whereCondition.updatedAt = {
        [Op.gte]: new Date(fromDate)
      };
    } else if (toDate) {
      whereCondition.updatedAt = {
        [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
      };
    }

    if (gateway) {
      // step-4 checking if the gateway includes in our GatewayNames
      const isExistingGateway = GatewayNames.includes(gateway?.toLowerCase());

      // step-5 if gateway exists in GatewayNames then adding gateway to whereCondition else throwing error
      if (isExistingGateway) {
        whereCondition.gateway = gateway.toLowerCase();
      } else {
        throw new AppError(
          statusCodes.NOT_FOUND,
          AppErrorCode.UnAuthorizedField(`${gateway} is not exists in our platform`)
        );
      }
    }

    // step-4 Dispute Id search Query parameter found then adding to where condition
    if (search) {
      whereCondition.customId = { [Op.iLike]: `%${search}%` }
    }

    // Pagination variables
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // step-5 fetching all dispute reviews with pagination, count, and sorting (latest first)
    const { count: totalDisputesCount, rows: disputes } = await Dispute.findAndCountAll({
      where: whereCondition,
      attributes: [
        "id",
        "customId",
        "paymentId",
        "gateway",
        "state",
        "amount",
        "dueDate",
        "workflowStage",
        "createdAt",
        "updatedAt"
      ],
      order: [['updatedAt', 'DESC']],
      offset,
      limit,
      raw: true,
    });

    // step-6 sending success response
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Dispute Reviews fetched successfully",
          {
            totalDisputesCount,
            totalPages: Math.ceil(totalDisputesCount / limit),
            page,
            limit,
            disputes,
          },
          true
        )
      );
  } catch (error) {
    console.log("Error in fetching disputes reviews : ", error?.message);
    return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Failed To Fetch Disputes Reviews",
          {
            message: error?.message || "Disputes Reviews Fetching Failed",
          },
          false
        )
      );
  }
})

// @desc 4. Fetch Merchant Disputes Submitted By Manager
const getDisputesSubmittedByManager = catchAsync(async (req, res) => {
  // @route GET /api/v2/merchant/disputes/manager/submitted
  try {
    // step-1 Destructuring currUser and userRole from request
    const { currUser, userRole, businessId } = req;
    const { fromDate, toDate, gateway, search } = req.query

    // step-2 Validate merchant selected active business account
    if (!businessId) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.validFieldIsRequired('Business account')
      );
    }

    // Validate currUser and userRole are authorization
    if (!currUser && !userRole.merchant) {
      throw new AppError(
        statusCodes.UNAUTHORIZED,
        AppErrorCode.YouAreNotAuthorized
      );
    }

    // step-3 Where condition payload
    const whereCondition = {
      businessId: businessId,
      workflowStage: "ACCEPTED",
    };

    // Validate from date and to date
    if (fromDate && !isValidDate(fromDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date"));
    }

    if (toDate && !isValidDate(toDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date"));
    }

    if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("To Date", "From Date",));
    }

    if (fromDate && toDate) {
      whereCondition.updatedAt = {
        [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
      };
    } else if (fromDate) {
      whereCondition.updatedAt = {
        [Op.gte]: new Date(fromDate)
      };
    } else if (toDate) {
      whereCondition.updatedAt = {
        [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
      };
    }

    if (gateway && typeof gateway === "string") {

      // step-4 checking if the gateway includes in our GatewayNames
      const isExistingGateway = GatewayNames.includes(gateway?.toLowerCase());

      // step-5 if gateway exists in GatewayNames then adding gateway to whereCondition else throwing error
      if (isExistingGateway) {
        whereCondition.gateway = gateway.toLowerCase();
      } else {
        throw new AppError(
          statusCodes.NOT_FOUND,
          AppErrorCode.UnAuthorizedField(`${gateway} is not exists in our platform`)
        );
      }
    }

    // step-4 Dispute Id search Query parameter found then adding to where condition
    if (search) {
      whereCondition.customId = { [Op.iLike]: `%${search}%` }
    }

    // Pagination variables
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // step-5 fetching all disputes submitted by manager with pagination, count, and sorting (latest first)
    const { count: totalDisputesCount, rows: disputes } = await Dispute.findAndCountAll({
      where: whereCondition,
      attributes: [
        "id",
        "customId",
        "paymentId",
        "updatedStageAt",
        "gateway",
        "state",
        "isSubmitted",
        "workflowStage",
        "createdAt",
        "updatedAt"
      ],
      order: [['updatedAt', 'DESC']],
      offset,
      limit,
      raw: true,
    });

    // step-6 sending success response
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Disputes Submitted By Manager fetched Successfully",
          {
            totalDisputesCount,
            totalPages: Math.ceil(totalDisputesCount / limit),
            page,
            limit,
            disputes,
          },
          true
        )
      );
  } catch (error) {
    console.log("Error in fetching disputes submitted by manager  : ", error?.message);
    return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Failed To Fetch Disputes Submitted By Manager",
          {
            message: error?.message || "Disputes Submitted By Manager Fetching Failed",
          },
          false
        )
      );
  }
})

// @desc 5. Update Dispute submit to payment gateway
const updateDisputeSubmitToPaymentGateway = catchAsync(async (req, res) => {
  // @route PUT /api/v2/merchant/disputes/:disputeId/submit/payment-gateway

  try {
    const { currUser, userRole, businessId } = req;
    const { disputeId } = req.params;

    // Step-1: Validate business and user
    if (!businessId) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.validFieldIsRequired("Business account")
      );
    }

    // Step-1.1: Validate that the current user is authorized as a merchant
    if (!currUser && !userRole.merchant) {
      throw new AppError(
        statusCodes.UNAUTHORIZED,
        AppErrorCode.YouAreNotAuthorized
      );
    }

    if (!disputeId) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.validFieldIsRequired("Dispute ID")
      );
    }

    // Step-2: Fetch the specific dispute
    const dispute = await Dispute.findOne({
      where: {
        businessId,
        customId: disputeId,
        workflowStage: "ACCEPTED"
      },
    });

    if (!dispute) {
      throw new AppError(
        statusCodes.NOT_FOUND,
        AppErrorCode.DataNotFound("Dispute")
      );
    }

    // Step-3: Toggle the `isSubmitted` field
    const newIsSubmittedValue = !dispute.isSubmitted;

    await dispute.update({ isSubmitted: newIsSubmittedValue });

    // Step-4: Success response
    return res.status(statusCodes.OK).json(
      success_response(
        statusCodes.OK,
        "Dispute submission status toggled successfully",
        {
          disputeId,
          isSubmitted: newIsSubmittedValue,
        },
        true
      )
    );

  } catch (error) {
    console.error("Error toggling dispute submission: ", error?.message);
    return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
      failed_response(
        error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
        "Failed to toggle dispute submission",
        {
          message: error?.message || "Unexpected error occurred",
        },
        false
      )
    );
  }
});

// @desc 6. Fetch Merchant Disputes Submitted Analyst By Stage wise assigned, submitted, accepted, rejected, resubmitted
const getDisputesSubmittedAnalystByStage = catchAsync(async (req, res) => {
  // @route GET /api/v2/merchant/disputes/submitted/analyst/stage/:stage
  try {
    // Step-1: Destructuring currUser and userRole from request
    const { currUser, userRole, businessId } = req;
    const { stage } = req.params;
    const { fromDate, toDate, analystId, gateway, search } = req.query;
    // Step-2: Validate if merchant has selected an active business account
    if (!businessId) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.validFieldIsRequired('Business account')
      );
    }

    // Step-2.1: Validate that the current user is authorized as a merchant
    if (!currUser && !userRole.merchant) {
      throw new AppError(
        statusCodes.UNAUTHORIZED,
        AppErrorCode.YouAreNotAuthorized
      );
    }

    // Step-3: Construct initial where condition for filtering disputes
    const whereCondition = {
      businessId: businessId,
    };

    // Step-6: Validate fromDate and toDate formats
    if (fromDate && !isValidDate(fromDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date"));
    }

    if (toDate && !isValidDate(toDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date"));
    }

    if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("To Date", "From Date"));
    }

    // Step-6.1: Apply date filtering on updatedAt based on provided dates
    if (fromDate && toDate) {
      whereCondition.updatedAt = {
        [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
      };
    } else if (fromDate) {
      whereCondition.updatedAt = {
        [Op.gte]: new Date(fromDate)
      };
    } else if (toDate) {
      whereCondition.updatedAt = {
        [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
      };
    }

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

    // Check if analystId is missing or not a valid UUID
    if (analystId && !uuidRegex.test(analystId)) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.validFieldIsRequired('Analyst')
      );
    }

    // If analystId is valid, add it to the where condition for filters based on specific  id
    if (analystId) {
      whereCondition.analystId = analystId;
    }

    // Step-4: Apply gateway filter if provided and valid
    if (gateway && typeof gateway === "string") {
      // Step-4.1: Check if gateway exists in supported GatewayNames
      const isExistingGateway = GatewayNames.includes(gateway?.toLowerCase());

      // Step-4.2: If gateway is valid, add it to filter; otherwise, throw an error
      if (isExistingGateway) {
        whereCondition.gateway = gateway.toLowerCase();
      } else {
        throw new AppError(
          statusCodes.NOT_FOUND,
          AppErrorCode.UnAuthorizedField(`${gateway} is not exists in our platform`)
        );
      }
    }

    // Step-5: Add search filter for dispute customId (if provided)
    if (search) {
      whereCondition.customId = { [Op.iLike]: `%${search}%` };
    }

    // Step-3.1: Apply workflowStage filtering logic
    if (stage && stage.toLowerCase() !== "assigned") {
      // If stage is provided and not "assigned", use that stage
      whereCondition.workflowStage = stage.toUpperCase();
    } else {
      // Otherwise, filter for disputes that are assigned (analystId not null) and in "PENDING" stage
      whereCondition.analystId = { [Op.ne]: null };
      whereCondition.workflowStage = "PENDING";
    }

    // Step-7: Setup pagination variables
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Step-8: Fetch all disputes submitted by analyst by stage wise with pagination, count, and latest first sorting
    const { count: totalDisputesCount, rows: disputes } = await Dispute.findAndCountAll({
      where: whereCondition,
      attributes: [
        "id",
        "customId",
        "paymentId",
        "analystId",
        "gateway",
        "state",
        "reason",
        "feedback",
        "dueDate",
        "isSubmitted",
        "lastStage",
        "lastStageAt",
        "updatedStage",
        "updatedStageAt",
        "workflowStage",
        "createdAt",
        "updatedAt"
      ],
      order: [['updatedAt', 'DESC']],
      offset,
      limit,
      raw: true
    });

    // Step-9: Extract unique analystIds from the disputes
    const analystIds = [...new Set(disputes.map(d => d.analystId).filter(Boolean))];

    // Step-10: Fetch analyst details using extracted IDs
    const analysts = await Analyst.findAll({
      where: { id: analystIds },
      attributes: ['id', 'firstName', 'lastName'],
      raw: true
    });

    // Step-11: Create a map of analystId => full name
    const analystMap = {};
    analysts.forEach(analyst => {
      analystMap[analyst.id] = `${analyst.firstName || ''} ${analyst.lastName || ''}`.trim();
    });

    // Step-12: Append analystName to each dispute based on analystId
    const updatedDisputes = disputes.map(dispute => ({
      analystName: analystMap[dispute.analystId] || null,
      ...dispute,
    }));

    // Step-13: Send success response with transformed dispute list
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Disputes Submitted By Analyst fetched Successfully",
          {
            totalDisputesCount,
            totalPages: Math.ceil(totalDisputesCount / limit),
            page,
            limit,
            disputes: updatedDisputes,
          },
          true
        )
      );

  } catch (error) {
    // Step-14: Catch any errors and return error response
    console.log("Error in fetching disputes submitted by analyst  : ", error?.message);
    return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Failed To Fetch Disputes Submitted By analyst",
          {
            message: error?.message || "Disputes Submitted By Analyst Fetching Failed",
          },
          false
        )
      );
  }
});

// @desc 7. Fetch Merchant Disputes Submitted Analyst By Stage wise assigned, submitted, accepted, rejected, resubmitted
const getDisputesReviewedHistory = catchAsync(async (req, res) => {
  // @route GET /api/v2/merchant/disputes/reviewed/history
  try {
    // Step-1: Destructuring currUser and userRole from request
    const { currUser, userRole, businessId } = req;
    const { fromDate, toDate, gateway, status, search } = req.query;
    // Step-2: Validate if merchant has selected an active business account
    if (!businessId) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.validFieldIsRequired('Business account')
      );
    }

    // Step-2.1: Validate that the current user is authorized as a merchant
    if (!currUser && !userRole.merchant) {
      throw new AppError(
        statusCodes.UNAUTHORIZED,
        AppErrorCode.YouAreNotAuthorized
      );
    }

    // Step-3: Construct initial where condition for filtering disputes
    const statusArray = ["ACCEPTED", "REJECTED", "RESUBMITTED"]
    const whereCondition = {
      businessId: businessId,
      workflowStage: { [Op.in]: statusArray }
    };

    // Step-6: Validate fromDate and toDate formats
    if (fromDate && !isValidDate(fromDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date"));
    }

    if (toDate && !isValidDate(toDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date"));
    }

    if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("To Date", "From Date"));
    }

    // Step-6.1: Apply date filtering on updatedAt based on provided dates
    if (fromDate && toDate) {
      whereCondition.updatedAt = {
        [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
      };
    } else if (fromDate) {
      whereCondition.updatedAt = {
        [Op.gte]: new Date(fromDate)
      };
    } else if (toDate) {
      whereCondition.updatedAt = {
        [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
      };
    }

    // Step-4: Apply gateway filter if provided and valid
    if (gateway && typeof gateway === "string") {
      // Step-4.1: Check if gateway exists in supported GatewayNames
      const isExistingGateway = GatewayNames.includes(gateway?.toLowerCase());

      // Step-4.2: If gateway is valid, add it to filter; otherwise, throw an error
      if (isExistingGateway) {
        whereCondition.gateway = gateway?.toLowerCase();
      } else {
        throw new AppError(
          statusCodes.NOT_FOUND,
          AppErrorCode.UnAuthorizedField(`${gateway} is not exists in our platform`)
        );
      }
    }

    // Step-3.1: Apply workflowStage filtering logic
    if (status) {
      if (statusArray.includes(status?.toUpperCase())) {
        whereCondition.workflowStage = status?.toUpperCase();
      } else {
        throw new AppError(
          statusCodes.BAD_REQUEST,
          AppErrorCode.fieldNotExist(status)
        );
      }
    }

    // Step-5: Add search filter for dispute customId (if provided)
    if (search) {
      whereCondition.customId = { [Op.iLike]: `%${search}%` };
    }


    // Step-7: Setup pagination variables
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Step-8: Fetch all disputes reviewed history with pagination, count, and latest first sorting
    const { count: totalDisputesCount, rows: disputes } = await Dispute.findAndCountAll({
      where: whereCondition,
      attributes: [
        "id",
        "customId",
        "paymentId",
        "gateway",
        "state",
        "reason",
        "lastStage",
        "lastStageAt",
        "updatedStage",
        "updatedStageAt",
        "workflowStage",
        "createdAt",
        "updatedAt"
      ],
      order: [['updatedAt', 'DESC']],
      offset,
      limit,
      raw: true
    });


    // Step-13: Send success response with transformed dispute list
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Disputes Submitted By Analyst fetched Successfully",
          {
            totalDisputesCount,
            totalPages: Math.ceil(totalDisputesCount / limit),
            page,
            limit,
            disputes,
          },
          true
        )
      );

  } catch (error) {
    // Step-14: Catch any errors and return error response
    console.log("Error in fetching disputes submitted by analyst  : ", error?.message);
    return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Failed To Fetch Disputes Submitted By analyst",
          {
            message: error?.message || "Disputes Submitted By Analyst Fetching Failed",
          },
          false
        )
      );
  }
});

const merchantDisputeController = {
  getDisputeStates,
  getDisputesList,
  getDisputesReviews,
  getDisputesSubmittedByManager,
  updateDisputeSubmitToPaymentGateway,
  getDisputesSubmittedAnalystByStage,
  getDisputesReviewedHistory
}

export default merchantDisputeController;