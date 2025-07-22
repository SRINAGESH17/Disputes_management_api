/**
 * @function getManagerDisputeStatusCards
 * @description Fetches the dispute status card details for the currently authenticated manager, including counts for accepted, rejected, pending, resubmitted, and total disputes.
 *
 * @route GET /api/v2/manager/disputes/requested/status
 *
 * @param {Object} req - Express request object
 * @param {Object} req.currUser - The currently authenticated user object
 * @param {Object} req.userRole - The roles associated with the current user
 * @param {string|number} req.businessId - The business ID associated with the request
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Success response with dispute status card details
 * @returns {Object} 400 - Bad request if user is not authorized or missing required fields
 * @returns {Object} 500 - Internal server error if fetching fails
 *
 * @throws {AppError} If the current user or user role is invalid
 *
 * Steps:
 * 1. Extracts the current user, user role, and business ID from the request.
 * 2. Validates the presence and authorization of the user.
 * 3. If business ID is missing, returns a default response with zeroed counts.
 * 4. Constructs a query to fetch disputes by workflow stage and manager.
 * 5. Aggregates dispute counts by stage and formats the response.
 * 6. Returns the dispute status card data or throws an error if any validation fails.
 */

/**
 * @function getUpcomingDeadlineDisputes
 * @description Fetches disputes with upcoming deadlines for the currently authenticated manager, supporting filtering by date range, gateway, and dispute ID, with pagination.
 *
 * @route GET /api/v2/manager/disputes/deadline
 *
 * @param {Object} req - Express request object
 * @param {Object} req.currUser - The currently authenticated user object
 * @param {Object} req.userRole - The roles associated with the current user
 * @param {string|number} req.businessId - The business ID associated with the request
 * @param {Object} req.query - Query parameters for filtering and pagination
 * @param {string} [req.query.fromDate] - Start date for filtering disputes
 * @param {string} [req.query.toDate] - End date for filtering disputes
 * @param {string} [req.query.gateway] - Payment gateway for filtering disputes
 * @param {string} [req.query.disputeId] - Dispute ID for search
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=10] - Number of results per page (max 25)
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Success response with paginated list of upcoming deadline disputes
 * @returns {Object} 400 - Bad request if user is not authorized or invalid query parameters
 * @returns {Object} 500 - Internal server error if fetching fails
 *
 * @throws {AppError} If the current user or user role is invalid or query parameters are invalid
 *
 * Steps:
 * 1. Extracts the current user, user role, business ID, and query parameters from the request.
 * 2. Validates the presence and authorization of the user.
 * 3. Validates date and gateway query parameters.
 * 4. Constructs a query to fetch disputes with upcoming deadlines and applies filters.
 * 5. Paginates the results and formats the response.
 * 6. Returns the paginated disputes or throws an error if any validation fails.
 */

/**
 * @function getWeekWiseAcceptedDisputes
 * @description Fetches the number of disputes accepted per week for a given month and year for the currently authenticated manager.
 *
 * @route GET /api/v2/manager/disputes/analysis/accepted
 *
 * @param {Object} req - Express request object
 * @param {Object} req.currUser - The currently authenticated user object
 * @param {Object} req.userRole - The roles associated with the current user
 * @param {string|number} req.businessId - The business ID associated with the request
 * @param {Object} req.query - Query parameters for month and year
 * @param {string} req.query.month - The month for which to fetch weekly accepted disputes (e.g., "january")
 * @param {number} req.query.year - The year for which to fetch weekly accepted disputes
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Success response with week-wise accepted disputes count
 * @returns {Object} 400 - Bad request if user is not authorized or invalid month/year
 * @returns {Object} 500 - Internal server error if fetching fails
 *
 * @throws {AppError} If the current user or user role is invalid or month/year is invalid
 *
 * Steps:
 * 1. Extracts the current user, user role, business ID, and month/year from the request.
 * 2. Validates the presence and authorization of the user.
 * 3. Validates the month and year parameters.
 * 4. Calculates the weeks in the specified month.
 * 5. Fetches accepted disputes for the given month and year.
 * 6. Aggregates the number of accepted disputes per week.
 * 7. Returns the week-wise accepted disputes data or throws an error if any validation fails.
 */

/**
 * @function getLastSixMonthsRevenueLost
 * @description Fetches the percentage of revenue lost due to disputes in the last six months, grouped by month, for the currently authenticated manager.
 *
 * @route GET /api/v2/manager/disputes/revenue/lost
 *
 * @param {Object} req - Express request object
 * @param {Object} req.currUser - The currently authenticated user object
 * @param {Object} req.userRole - The roles associated with the current user
 * @param {string|number} req.businessId - The business ID associated with the request
 * @param {Object} req.query - Query parameters for month and year
 * @param {string} req.query.month - The reference month for the last six months calculation (e.g., "january")
 * @param {number} req.query.year - The reference year for the last six months calculation
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Success response with revenue lost per month for the last six months
 * @returns {Object} 400 - Bad request if user is not authorized or invalid month/year
 * @returns {Object} 500 - Internal server error if fetching fails
 *
 * @throws {AppError} If the current user or user role is invalid or month/year is invalid
 *
 * Steps:
 * 1. Extracts the current user, user role, business ID, and month/year from the request.
 * 2. Validates the presence and authorization of the user.
 * 3. Validates the month and year parameters.
 * 4. Calculates the last six months based on the provided month and year.
 * 5. Fetches disputes resolved as "won" or "lost" within the last six months.
 * 6. Aggregates the revenue lost percentage per month.
 * 7. Returns the revenue lost data or throws an error if any validation fails.
 */



import _ from "lodash";
import { Op, Sequelize } from "sequelize";
import catchAsync from "../../utils/catch-async.util.js";
import statusCodes from "../../constants/status-codes.constant.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import AppError from "../../utils/app-error.util.js";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import { GatewayNames } from "../../constants/gateways.constant.js";
import Dispute from "../../models/dispute.model.js";
import Analyst from "../../models/analyst.model.js";
import sequelize from "../../config/database.config.js";
import { getLastSixMonthsDetails, getWeeksInAMonth } from "../../utils/date-handlers.util.js";



const isValidDate = (dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

function isValidYear(year) {
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

// @desc Fetching the Manager Dispute Status Cards
const getManagerDisputeStatusCards = catchAsync(async (req, res) => {

    // @route  : GET  /api/v2/manager/disputes/requested/status
    try {
        // Step 1 : Extracting the Current User , UserRole and Business Id from the Request
        const { currUser, userRole, businessId } = req;

        // Step 2 : Validating the Current User , is Manager and BusinessId from the req
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.UnAuthorizedField("Current User"));
        };

        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        };

        if (!userRole.manager) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        }

        // Step 3 : If there is not BusinessId from the request Instead of throwing the Error
        //           we are throwing the Object which will replicate the Response of the Api 
        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Disputes Fetched Successfully",
                    {
                        totalDisputesRequested: 0,
                        acceptedDisputes: 0,
                        rejectedDisputes: 0,
                        reReceivedDispute: 0,
                        pending: 0,
                        submittedToMerchant: 0,
                    }
                )
            )
        };



        // Step 4 : Creating a WhereClause To Find the Disputes Based on the Cards
        const whereClause = {
            [Op.or]: [{
                businessId,
                workflowStage: "SUBMITTED"
            },
            {
                businessId,
                workflowStage: { [Op.in]: ["ACCEPTED", "REJECTED", "RESUBMITTED"] },
                managerId: currUser?.userId
            }
            ]
        };


        // Step 5 : Fetching all the Dispute Status Card Details 

        const totalDisputes = await Dispute.findAll({
            where: whereClause,
            attributes: ['workflowStage', [sequelize.fn('COUNT', sequelize.col('business_id')), 'count']],
            group: ['workflowStage'],
            raw: true
        });

        // Step 6 : Based on the WorkFlowStage we are mapping count  to the WorkStages 
        const disputeCountsByStage = totalDisputes.reduce((acc, item) => {
            acc[item.workflowStage] = parseInt(item.count || 0);
            return acc;
        }, {});


        // Step 7 : Destructuring the Dispute by WorkFlowStage
        const {
            ACCEPTED = 0,
            REJECTED = 0,
            SUBMITTED = 0,
            RESUBMITTED = 0
        } = disputeCountsByStage;

        // Step 8 :  Finalizing an Object to Send the Status Cards as Response 
        const disputeStatusCards = {
            acceptedDisputes: ACCEPTED,
            rejectedDisputes: REJECTED,
            pendingDisputes: SUBMITTED,
            resubmittedDisputes: RESUBMITTED,
            totalDisputes: ACCEPTED + REJECTED + SUBMITTED + RESUBMITTED,
            submittedToMerchant: ACCEPTED
        };


        // Step 9 : returning the Response of the Dispute Status Cards
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetched Disputes Status Cards",
                { disputeStatusCards },
                true
            )

        )

    } catch (error) {
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


// @desc Fetching the Upcoming Deadline Disputes 
const getUpcomingDeadlineDisputes = catchAsync(async (req, res) => {
    // @route   : GET /api/v2/manager/disputes/deadline
    try {
        // Step 1 : Extracting the CurrentUser , userRole and BusinessId From the middleware request 
        const { currUser, userRole, businessId } = req;


        // Step 2 : For Search We are Taking from the params
        const { fromDate, toDate, gateway, disputeId } = req.query;

        // Step 3 : Initializing The variables for pagination
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 25);
        const offset = (page - 1) * limit;


        // Step 4 : Validating the Current User , is Manager and BusinessId from the req
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.UnAuthorizedField("Current User"));
        };

        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        };

        if (!userRole.manager) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        }

        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Disputes Fetched Successfully",
                    {
                        totalPages: 0,
                        totalDisputes: 0,
                        page: 0,
                        limit: 10,
                        disputes: []
                    }
                )
            )
        }

        // Step 5 : Validating the From and To Date and Also if Gateway validating the gateway 

        if (fromDate && !isValidDate(fromDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("From Date!"));
        }

        if (toDate && !isValidDate(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("To Date!"));
        }

        if (isValidDate(fromDate) && isValidDate(toDate) && new Date(fromDate) > new Date(toDate)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField1MustBeValidField2("From Date", "To Date"));
        }

        if (gateway) {
            if (!GatewayNames.includes(gateway.toLowerCase())) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidField("Gateway"));
            }
        }



        // Step 6 : Creating a WhereClause to Fetch the Disputes based on the condition 
        const whereClause = {
            businessId,
            workflowStage: "SUBMITTED",
            dueDate: {
                [Op.gt]: new Date()
            }

        };


        // Step 7 : If There is any Date Query  or Gateway or DisputeId for Searching the Disputes adding them to where clause 
        if (fromDate && toDate) {
            whereClause.updatedStageAt = {
                [Op.between]: [new Date(fromDate), new Date(toDate).setHours(23, 59, 59, 999)]
            };
        } else if (fromDate) {
            whereClause.updatedStageAt = {
                [Op.gte]: new Date(fromDate)
            };
        } else if (toDate) {
            whereClause.updatedStageAt = {
                [Op.lte]: new Date(toDate).setHours(23, 59, 59, 999)
            };
        }


        if (gateway) {
            whereClause.gateway = gateway;
        };

        if (disputeId) {
            whereClause.customId = `%${disputeId}%`;
        }




        // Step 8 : Fetching the Upcoming deadline Disputes based on the where condition and the total count of the disputes 
        const { count: totalDisputes, rows: upcomingDeadlineDisputes } = await Dispute.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'disputeId', 'customId', 'paymentId', 'gateway', 'updatedStageAt', 'lastStageAt', 'reason', 'dueDate', 'state', 'workflowStage', 'createdAt', 'feedback', 'updatedAt'],
            include: [
                {
                    model: Analyst,
                    as: 'DisputeAnalyst',
                    attributes: ['firstName', 'lastName']
                }
            ],
            limit: limit,
            offset: offset,
            order: [['dueDate', 'ASC']],
            raw: true,
        })


        const totalPages = Math.ceil(totalDisputes / limit);


        //Step 9 : Creating a Custom Payload for the Disputes in Detail
        const disputes = upcomingDeadlineDisputes.map((dispute) => {
            return {
                disputeId: dispute?.customId,
                paymentId: dispute?.paymentId,
                submittedBy: `${dispute['DisputeAnalyst.firstName']} ${dispute['DisputeAnalyst.lastName']}`,
                paymentGateway: dispute?.gateway,
                submittedOn: dispute?.updatedStageAt,
                reason_For_dispute: dispute?.reason,
                disputeStatus: dispute?.state,
                respondBy: dispute?.dueDate,
                feedback: dispute?.feedback,
                currentStage: dispute?.workflowStage,
                created: dispute?.createdAt,
            }
        });


        // Step 10 : returning the Response  of Disputes with the pagination and the total  Count
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Dispute with UpComing Deadlines Fetched",
                {
                    totalPages,
                    totalDisputes,
                    page,
                    limit,
                    disputes
                },
                true
            )
        )

    } catch (error) {
        console.log(error?.message || "Error while Fetching the Upcoming Deadline Dispute ");
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Fetching Upcoming Deadline Disputes Failed",
                { message: error?.message || "Failed Fetching Upcoming Dispute Deadlines" },
                false,
            )
        )
    }
});

// @desc Fetching the Number of Disputes Accepted Weekly Wise in a Month 
const getWeekWiseAcceptedDisputes = catchAsync(async (req, res) => {

    // @route    : GET /api/v2/manager/disputes/analysis/accepted
    try {

        // Step 1 : Extracting the CurrentUser , userRole and BusinessId From the middleware request 
        const { currUser, userRole, businessId } = req;

        // Step 2 : Extracting the Month and Year From the query params to Find out disputes in the particular month 
        let { month, year } = req.query;

        // Step 3 : Checking the Current Month and Current Year 
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();



        // Step 4 : Validating the Current User , is Manager and BusinessId from the req
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.UnAuthorizedField("Current User"));
        };

        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        };

        if (!userRole.manager) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        }

        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Week Wise Accepted Disputes Data  Successfully",
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
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("Featured Month "));
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
            managerId: currUser?.userId,
            workflowStage: "ACCEPTED",
            updatedStageAt: {
                [Op.between]: [new Date(firstDateOfMonth), new Date(lastDateOfMonth)]
            }
        }


        // Step 11 : Fetching the Dispute based on the WhereClause
        const disputes = await Dispute.findAll({ where: whereClause, attributes: ['id', 'updatedStageAt'], order: [['updatedStageAt', "ASC"]], raw: true });

        // Step 12 : initializing the Week Response Obj to show Disputes in Each week
        const weekWiseAcceptedDisputes = {};


        // Step 12.1: Initialize the weeks object
        weeks.forEach((_, index) => {
            weekWiseAcceptedDisputes[`Week ${index + 1}`] = 0;
        });

        // Step 12.2 : Count disputes per week
        weeks.forEach((week, index) => {
            const start = new Date(week.start);
            const end = new Date(week.end);

            disputes.forEach((dispute) => {
                const updated = new Date(dispute.updatedStageAt);

                if (updated >= start && updated <= end) {
                    weekWiseAcceptedDisputes[`Week ${index + 1}`]++;
                }
            });
        });



        // Step 13 Returning the total week Disputes in the Response 
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetched Week Wise Accepted Disputes",
                { weekWiseAcceptedDisputes },
                true
            )
        );

    } catch (error) {
        console.log(error?.message || "Error while Fetching the Accepted Dispute Data In week wise");
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch the Week Wise Accepted Disputes",
                { message: error?.message || "Fetching the Week Wise Accepted Disputes Data" },
                false
            )
        )
    }
});


// @desc  Fetching the Revenue Lost in Last Six Months 
const getLastSixMonthsRevenueLost = catchAsync(async (req, res) => {

    // @route   : GET  /api/v2/manager/disputes/revenue/lost
    try {
        // Step 1 : Extracting the CurrentUser , userRole and BusinessId From the middleware request 
        const { currUser, userRole, businessId } = req;

        // Step 2 : Extracting the Month and Year From the query params to Find out disputes in the particular month 
        let { month, year } = req.query;

        // Step 3 : Checking the Current Month and Current Year 
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();



        // Step 4 : Validating the Current User , is Manager and BusinessId from the req
        if (_.isEmpty(currUser)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.UnAuthorizedField("Current User"));
        };

        if (!currUser.userId) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        };

        if (!userRole.manager) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.YouAreNotAuthorized);
        }

        if (_.isEmpty(businessId)) {
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Week Wise Submitted Disputes Data  Successfully",
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

        // console.log(monthIndex);
        // Step 7 : Validating the Month based on the Current Month
        if (monthIndex > currentMonth) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat("Featured Month "));
        }

        // Step 8 Fetching the Number of Weeks with the start and End day of the weeks
        const lastSixMonths = getLastSixMonthsDetails(year, monthIndex + 1);

        const startingDate = lastSixMonths[0].firstDate;
        const endingDate = lastSixMonths[lastSixMonths.length - 1].lastDate;



        // Step 9 : Creating a whereClause to Find the Disputes which are Resolved
        const whereClause = {
            businessId,
            state: ["won", "lost"],
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




        // Step 11 : creating a Month Map to map the month and creating a object for the Won and Lost 
        // for individual months 
        const monthMap = new Map();

        lastSixMonths.forEach((month) => {
            const key = getKey(month.year, month.month);
            monthMap.set(key, { won: 0, lost: 0, revenueLost: 0 })
        });


        // Step 12 : Based on the Matching of the month instead of looping each dispute for 
        // where checking the Key and then Attaching the Values 

        disputes.forEach((dispute) => {
            const key = getKey(dispute.year, dispute.month);
            const state = dispute.state
            const month = monthMap.get(key);
            if (month) {
                month[state] += parseInt(dispute.amount);
            }
        })

        // Step 13 : Creating an Array to store the Revenue lost Each month 
        let revenueLostPerMonth = [];
        monthMap.forEach((month, key) => {

            const total = month.won + month.lost;
            const lossPercent = total > 0 ? Math.round((month.lost / total) * 10000) / 100 : 0

            revenueLostPerMonth.push({
                month: key,
                ...month,
                revenueLost: lossPercent
            })

        })

        // Step 14 : returning the Response of Individuals Months 
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetched Last 6 Months Revenue Lost",
                { revenueLostPerMonth },
                true
            )
        )

    } catch (error) {
        console.log(error?.message || "Error while Fetching the Revenue Lost in last 6 Months");
        return res.status(error?.statusCodes || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                statusCodes.INTERNAL_SERVER_ERROR,
                "Failed to Fetch Revenue Lost in 6 Months",
                { message: error?.message || "Fetching of Revenue Lost in 6 Months Failed" },
                false
            )
        )
    }
});


const managerDashboardController = {
    getUpcomingDeadlineDisputes,
    getManagerDisputeStatusCards,
    getWeekWiseAcceptedDisputes,
    getLastSixMonthsRevenueLost
}





export default managerDashboardController;














/// ************************ //////////////////

// const [pendingDisputes, acceptedDisputes, rejectedDisputes, resubmittedDisputes] = await Promise.all([
//     await Dispute.count({ where: { workflowStage: "SUBMITTED", businessId } }),

//     await Dispute.count({ where: { workflowStage: "ACCEPTED", businessId, managerId: currUser.userId } }),

//     await Dispute.count({ where: { workflowStage: "REJECTED", businessId, managerId: currUser.userId } }),

//     await Dispute.count({ where: { workflowStage: "RESUBMITTED", businessId, managerId: currUser.userId } }),
// ])

// const disputeCards = {
//     totalDisputes: acceptedDisputes + rejectedDisputes + pendingDisputes + resubmittedDisputes,
//     acceptedDisputes,
//     rejectedDisputes,
//     submittedToMerchant: acceptedDisputes,
//     pendingDisputes,
//     resubmittedDisputes
// }

// return res.status(statusCodes.OK).json(
//     success_response(
//         statusCodes.OK,
//         "Successfully Fetched Disputes Status Cards",
//         {
//             disputeCards
//         },
//         true
//     )

// )





// console.log(startingDate, endingDate);

// const wonWhereClause = {
//     businessId,
//     state: "won",

//     updatedAt: {
//         [Op.between]: [new Date(startingDate), new Date(endingDate)]
//     }
// };

// const lostWhereClause = {
//     businessId,
//     state: "lost",
//     updatedAt: {
//         [Op.between]: [new Date(startingDate), new Date(endingDate)]
//     }
// }


// const [wonDisputes, lostDisputes] = await Promise.all([
//     await Dispute.findAll({ where: wonWhereClause, attributes: ['amount', 'updatedAt'], raw: true }),
//     await Dispute.findAll({ where: lostWhereClause, attributes: ['amount', 'updatedAt'], raw: true }),

// ])


// lastSixMonths.map((month) => {
//     wonDisputes.forEach((won) => {

//         if (new Date(won.updatedAt).toISOString() <= new Date(month.lastDate).toISOString() && new Date(won.updatedAt).toISOString() >= new Date(month.firstDate).toISOString()) {
//             month.wonRevenue += won.amount;
//             month.totalRevenue += month.wonRevenue;
//         }
//     })
//     lostDisputes.forEach((lost) => {

//         if (new Date(lost.updatedAt).toISOString() <= new Date(month.lastDate).toISOString() && new Date(lost.updatedAt).toISOString() >= new Date(month.firstDate).toISOString()) {
//             month.lostRevenue += lost.amount;
//             month.totalRevenue += month.lostRevenue
//         }
//     })

// });



// const monthWiseRevenue = {};

// lastSixMonths.map((month) => {
//     month.firstDateTs = Date.parse(month.firstDate);
//     month.lastDateTs = Date.parse(month.lastDate);
//     month.won = 0;
//     month.lost = 0;
//     month.totalRevenue = 0;
// })




// disputes.forEach(dispute => {
//     const disputeTs = Date.parse(dispute.updatedAt);
//     lastSixMonths.forEach(month => {
//         if (disputeTs >= month.firstDateTs && disputeTs <= month.lastDateTs) {
//             month[dispute.state] += dispute.amount;
//             month.totalRevenue += dispute.amount;
//         }
//     });
// });


// const revenueLostPerMonth = [];

// lastSixMonths.forEach((month) => {
//     let revenueLost = 0;
//     if (month?.totalRevenue && month?.lost) {
//         revenueLost = Math.round((month.lost / month.totalRevenue) * 10000) / 100;
//         revenueLostPerMonth.push(revenueLost);
//     } else {
//         revenueLostPerMonth.push(0);
//     }
// })
