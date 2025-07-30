import _  from "lodash";
import catchAsync from "../../utils/catch-async.util.js";
import AppError from "../../utils/app-error.util.js";
import statusCodes from "../../constants/status-codes.constant.js";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import { Op, Sequelize } from "sequelize";
import Dispute from "../../models/dispute.model.js";
import sequelize from "../../config/database.config.js";
import { GatewayNames } from "../../constants/gateways.constant.js";
import { getLastSixMonthsDetails, getWeeksInAMonth } from "../../utils/date-handlers.util.js";

const isValidDate = (dateStr) => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

const isValidYear = (year) => {
    return (
        typeof year === 'number' &&
        !isNaN(year) &&
        Number.isInteger(year) &&
        year >= 1000 &&
        year <= 9999
    );
}

const getKey = (month, year) => {
    return `${year}-${String(month).padStart(2, '0')}`
}

const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];


// 1. @desc Fetching the Analyst Dispute Status Cards
const getAnalystDisputeStatusCards = catchAsync(async (req, res) => {
    // @route  : GET  /api/v2/analyst/disputes/requested/status
    try {
        // Step 1: Extract current user, their role, businessId, and optional date filters from the request
        const { currUser, userRole, businessId } = req;
        const { fromDate, toDate } = req.query;

        // Step 2: Validate that current user exists and has Analyst role
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.UnAuthorizedField("Current User"));
        };

        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        };

        if (!userRole.analyst) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        }

        // Step 3: Validate fromDate and toDate formats if provided
        if (fromDate && !isValidDate(fromDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date"));
        }

        if (toDate && !isValidDate(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date"));
        }

        // Step 4: Ensure fromDate is not after toDate if both are valid
        if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("To Date", "From Date"));
        }

        // Step 5: If businessId is not provided, return an empty-card response instead of error
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Disputes Fetched Successfully",
                    {
                        totalDisputesAssigned: 0,
                        acceptedDisputes: 0,
                        rejectedDisputes: 0,
                        submittedToManager: 0,
                        pendingDisputes: 0,
                        reSubmittedDisputes: 0,
                    },
                    true
                )
            )
        };

        // Step 6: Construct the where condition to fetch dispute records
        const whereCondition = {
            businessId,
            workflowStage: { [Op.in]: ["PENDING", "SUBMITTED", "ACCEPTED", "REJECTED", "RESUBMITTED"] },
            analystId: currUser?.userId
        };

        // Step 7: Apply date filter (if fromDate/toDate provided) on updatedAt field
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

        // Step 8: Query database to fetch dispute counts grouped by workflowStage
        const totalDisputes = await Dispute.findAll({
            where: whereCondition,
            attributes: ['workflowStage', [sequelize.fn('COUNT', sequelize.col('business_id')), 'count']],
            group: ['workflowStage'],
            raw: true
        });

        // Step 9: Transform result array into a key-value object of counts by stage
        const disputeCountsByStage = totalDisputes.reduce((acc, item) => {
            acc[item.workflowStage] = parseInt(item.count || 0);
            return acc;
        }, {});

        // Step 10: Extract counts from the map with defaults as 0 if missing
        const {
            PENDING = 0,
            SUBMITTED = 0,
            ACCEPTED = 0,
            REJECTED = 0,
            RESUBMITTED = 0
        } = disputeCountsByStage;

        // Step 11: Format the final response object for the status cards
        const disputeStatusCards = {
            totalDisputesAssigned: PENDING + SUBMITTED + ACCEPTED + REJECTED + RESUBMITTED,
            acceptedDisputes: ACCEPTED,
            rejectedDisputes: REJECTED,
            submittedToManager: SUBMITTED,
            pendingDisputes: PENDING,
            reSubmittedDisputes: RESUBMITTED,
        };

        // Step 12: Send the response back to the client
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetched Disputes Status Cards",
                { disputeStatusCards },
                true
            )
        )

    } catch (error) {
        // Step 13: Handle and respond with any errors encountered
        console.log(error?.message || "Error While Fetching the Dispute Status Cards Details");
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch the Dispute Status Cards",
                { message: error?.message || "Fetching Dispute Status Cards Failed" },
                false
            )
        )
    }
})

// 2. @desc Fetching the Number of Disputes Assigned Weekly Wise in a Month 
const getWeeklyWiseAssignedDisputes = catchAsync(async (req, res) => {
    // @route : GET /api/v2/analyst/disputes/analysis/assigned
    try {
        // Step 1 : Extracting the CurrentUser , userRole and BusinessId From the middleware request 
        const { currUser, userRole, businessId } = req;

        // Step 2 : Extracting the Month and Year From the query params to Find out disputes in the particular month 
        const { month, year } = req.query;

        // Step 3 : Checking the Current Month and Current Year 
      const currentMonth = new Date().getMonth(); // 0-11 (January is 0, December is 11)
      const currentYear = new Date().getFullYear(); 
      
        // Step 4 : Validating the Current User , is Manager and BusinessId from the req
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.UnAuthorizedField("Current User"));
        };

        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        };

        if (!userRole.analyst) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        }

        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Weekly Wise Assigned Disputes Data",
                    {
                        totalDisputes: 0,
                        disputesCountPerWeek: 0,
                    }
                )
            )
        };

        // Step 5 : Checking the Month and Year from the Query Params Exist or not and validating the Incoming Year and Month 
        if (_.isEmpty(month) && _.isEmpty(year)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("Month and Year"));
        };

        if (year && !isValidYear(parseInt(year)) || year > currentYear) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("Year"));
        }

        if (month && !months.includes(month.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("Month"));
        }

        // Step 6 :  Checking the Index of Passed Month 
      const monthIndex = months.indexOf(month.toLowerCase());
      
        // Step 7 : Validating the Month based on the Current Month
        if (monthIndex > currentMonth) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("Featured Month"));
        }

        // Step 8 Fetching the Number of Weeks with the start and End day of the weeks
      const weeks = getWeeksInAMonth(year, monthIndex);

      // Step 9 : Finding the last and First Date of the Given Date 
      const firstDateOfMonth = new Date(Date.UTC(year, monthIndex, 1));
      const lastDateOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0));
      lastDateOfMonth.setUTCHours(23, 59, 59, 999);

        // Step 10 : Creating the WhereClause to Filter the Dispute the based on the condition
        const whereClause = {
            businessId,
            analystId: currUser?.userId,
            workflowStage: "PENDING",
            updatedAt: {
                [Op.between]: [new Date(firstDateOfMonth), new Date(lastDateOfMonth)]
            }
      }

        // Step 11 : Fetching the Dispute based on the WhereClause
        const disputes = await Dispute.findAll({ where: whereClause, attributes: ['id', 'updatedAt'], order: [['updatedAt', "ASC"]], raw: true });

        // Step 12 : initializing the Week Response Obj to show Disputes in Each week
        const weeklyWiseAssignedDisputes = {};

        // Step 12.1: Initialize the weeks object
      weeks.forEach((_, index) => {
            weeklyWiseAssignedDisputes[`Week ${index + 1}`] = 0;
      });
      
  
        // Step 12.2 : Count disputes per week
      weeks.forEach((week, index) => {
            const start = new Date(week.start);
            const end = new Date(week.end);

            disputes.forEach((dispute) => {
                const updated = new Date(dispute.updatedAt);

                if (updated >= start && updated <= end) {
                    weeklyWiseAssignedDisputes[`Week ${index + 1}`]++;
                }
            });
        });
      
        // Step 13 Returning the total week Disputes in the Response 
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetched Weekly Wise Assigned Disputes",
                { weeklyWiseAssignedDisputes },
                true
            )
        );
    } catch (error) {
        console.log(error?.message || "Error while Fetching the Assigned Dispute Data In weekly wise");
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch the Weekly Wise Assigned Disputes",
                { message: error?.message || "Fetching the Weekly Wise Assigned Disputes Data" },
                false
            )
        )
    }
});

// 3. @desc Fetching the Money Lost in Last Six Months 
const getLastSixMonthsMoneyLost = catchAsync(async (req, res) => {
  // @route   : GET  /api/v2/analyst/disputes/money/lost
  try {
    // Step 1 : Extracting the currentUser, userRole and BusinessId From the middleware request 
    const { currUser, userRole, businessId } = req;

    // Step 2 : Extracting the Month and Year From the query params to Find out disputes in the particular month 
    let { month, year } = req.query;

    // Step 3 : Checking the Current Month and Current Year 
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Step 4 : Validating the Current User, is Analyst and BusinessId from the req
    if (_.isEmpty(currUser)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.UnAuthorizedField("Current User"));
    };

    if (!currUser.userId) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
    };

    if (!userRole.analyst) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
    }

    if (_.isEmpty(businessId)) {
      return res.status(statusCodes.OK).json(
        success_response(
          statusCodes.OK,
          "Last Six Months Money Lost Data Successfully",
          {
            totalDisputes: 0,
            lastSixMonthsMoneyLost: 0,
          }
        )
      )
    };



    // Step 5 : Checking the Month and Year from the Query Params Exist or not and validating the Incoming Year and Month 
    if (_.isEmpty(month) && _.isEmpty(year)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("Month and Year"));
    };

    if (year && !isValidYear(parseInt(year)) || year > currentYear) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("Year"));
    }

    if (month && !months.includes(month.toLowerCase())) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("Month"));
    }

    // Step 6 :  Checking the Index of Passed Month 
    const monthIndex = months.indexOf(month.toLowerCase());
      
    // Step 7 : Validating the Month based on the Current Month
    if (monthIndex > currentMonth) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("Featured Month"));
    }

    // Step 8 Fetching the Number of Weeks with the start and End day of the weeks
    const lastSixMonths = getLastSixMonthsDetails(year, monthIndex + 1);

    const startingDate = lastSixMonths[0].firstDate;
    const endingDate = lastSixMonths[lastSixMonths.length - 1].lastDate;

    // Step 9 : Creating a whereClause to Find the Disputes which are Resolved
    const whereClause = {
      businessId,
      analystId: currUser?.userId,
      state: ['won', 'lost'],
      updatedAt: {
        [Op.between]: [new Date(startingDate), new Date(endingDate)]
      }
    };
      
    // Step 10 : Fetching the Disputes from the whereClause and Aggregating them and grouping the Values from the Disputes
    const disputes = await Dispute.findAll({
      attributes: [
        [Sequelize.literal(`EXTRACT(MONTH FROM "updated_at")`), 'month'],
        [Sequelize.literal(`EXTRACT(YEAR FROM "updated_at")`), 'year'],
        'state',
        [Sequelize.fn('SUM', Sequelize.col('amount')), "amount"],
      ],
      where: whereClause,
      group: [Sequelize.literal(`EXTRACT(MONTH FROM "updated_at")`), Sequelize.literal(`EXTRACT(YEAR FROM "updated_at")`), 'state'],
      raw: true
    });

    // Step 11 : creating a Month Map to map the month and creating a object for the Won and Lost for individual months 
    const monthMap = new Map();

    lastSixMonths.forEach((month) => {
      const key = getKey(month.month, month.year);
      monthMap.set(key, { won: 0, lost: 0, revenueLost: 0 })
    });

    // Step 12 : Based on the Matching of the month instead of looping each dispute for 
    // where checking the Key and then Attaching the Values 

    disputes.forEach((dispute) => {
      const key = getKey(dispute.month, dispute.year);
      const state = dispute.state
      const month = monthMap.get(key);
      if (month) {
        month[state] += parseInt(dispute.amount);
      }
    })

    // Step 13 : Creating an Array to store the Money lost Each month 
    let moneyLostPerMonth = [];
    monthMap.forEach((month, key) => {

      const total = month.won + month.lost;
      const lossPercent = total > 0 ? Math.round((month.lost / total) * 10000) / 100 : 0

      moneyLostPerMonth.push({
        month: key,
        ...month,
        revenueLost: lossPercent
      })
    })

    // Step 14 : Returning the Success Response of Individuals Months 
    return res.status(statusCodes.OK).json(
      success_response(
        statusCodes.OK,
        "Successfully Fetched Last 6 Months Money Lost",
        { moneyLostPerMonth },
        true
      )
    )

  } catch (error) {
    console.log(error?.message || "Error while Fetching the Money Lost in last 6 Months");
    return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
      failed_response(
        statusCodes.INTERNAL_SERVER_ERROR,
        "Failed to Fetch Money Lost in 6 Months",
        { message: error?.message || "Fetching of Money Lost in 6 Months Failed" },
        false
      )
    )
  }
});

// 4. @desc Fetch Analyst Disputes with Upcoming Deadlines by Stage (PENDING, RESUBMITTED)
const getUpcomingDeadlineDisputes = catchAsync(async (req, res) => {
  // @route GET /api/v2/analyst/disputes/deadline
  try {
    // Step-1: Extract current user (analyst), user role, business ID, and optional query params
    const { currUser, userRole, businessId } = req;
    const { fromDate, toDate, gateway } = req.query;
      
    // Step-2: Ensure businessId is present (merchant has selected an active business)
    if (!businessId) {
      throw new AppError(
        statusCodes.BAD_REQUEST,
        AppErrorCode.validFieldIsRequired('Business account')
      );
    }

    // Step-2.1: Validate the current user is authorized and has Analyst role
    if (!currUser && !userRole.analyst) {
      throw new AppError(
        statusCodes.UNAUTHORIZED,
        AppErrorCode.YouAreNotAuthorized
      );
    }

    // Step-3: Build base where clause to filter disputes assigned to this analyst in PENDING or RESUBMITTED stage
    const whereCondition = {
        businessId: businessId,
        // lastStage: 'ASSIGNED',
        workflowStage: {[Op.in]: ['PENDING', 'RESUBMITTED']},
        analystId: currUser?.userId
    };

   // Step-4: Validate fromDate and toDate if present
    if (fromDate && !isValidDate(fromDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date"));
    }

    if (toDate && !isValidDate(toDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date"));
    }

    if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
      throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("To Date", "From Date"));
    }

    // Step-4.1: Add date filters to the where clause based on updatedAt field
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
    
    // Step-5: If gateway is provided, validate and add to the where clause
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

    // Step-6: Set up pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Step-7: Fetch filtered disputes assigned to the analyst with pagination and sorting
    const { count: totalDisputesCount, rows: disputesArr } = await Dispute.findAndCountAll({
      where: whereCondition,
      limit,
      skip,
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
      raw: true
    });

    // Step-8: Transform raw dispute rows into a cleaner response format for the client
    const disputes = disputesArr.map((dispute) => {
      return {
        id: dispute?.id,
        disputeId: dispute?.customId,
        paymentId: dispute?.paymentId,
        paymentGateway: dispute?.gateway,
        paymentGatewayStatus: dispute?.state,
        submittedOn: dispute?.updatedStageAt,
        submitted: dispute?.isSubmitted,
        reason_for_dispute: dispute?.reason,
        dateRaised: dispute?.createdAt,
        respondBy: dispute?.dueDate,
        lastStage: dispute?.lastStage,
        feedback: dispute?.feedback,
        updatedStage: dispute?.updatedStage,
        lastStageAt: dispute?.lastStageAt,
        updatedStageAt: dispute?.updatedStageAt,
        currentStage: dispute?.workflowStage,
        updated: dispute?.updatedAt
      }
    });

    // Step-9: Return successful response with paginated and formatted dispute list
    return res
      .status(statusCodes.OK)
      .json(
        success_response(
          statusCodes.OK,
          "Upcoming Deadlines Disputes Fetched Successfully",
          {
            totalDisputesCount,
            totalPages: Math.ceil(totalDisputesCount / limit),
            page,
            limit,
            disputes
          },
          true
        )
      );

  } catch (error) {
    // Step-10: Handle errors gracefully and return standard error response
    console.log("Error while Fetching the Upcoming Deadline Dispute : ", error?.message);
    return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR)
      .json(
        failed_response(
          error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
          "Fetching Upcoming Deadline Disputes Failed",
          {
            message: error?.message || "Failed Fetching Upcoming Dispute Deadlines",
          },
          false
        )
      );
  }
});

const analystDashboardController = {
    getAnalystDisputeStatusCards,
    getWeeklyWiseAssignedDisputes,
    getLastSixMonthsMoneyLost,
    getUpcomingDeadlineDisputes,
}

export default analystDashboardController;