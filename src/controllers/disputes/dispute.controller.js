import _ from "lodash";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import statusCodes from "../../constants/status-codes.constant.js";
import Dispute from "../../models/dispute.model.js";
import AppError from "../../utils/app-error.util.js";
import catchAsync from "../../utils/catch-async.util.js";
import helpers from "../../utils/helpers.util.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import DisputeHistory from "../../models/dispute-history.model.js";
import Attachment from "../../models/attachment.model.js";
import RejectFeedback from "../../models/reject-feedback.model.js";
import Merchant from "../../models/merchant.model.js";
import Manager from "../../models/manager.model.js";
import Analyst from "../../models/analyst.model.js";
import { Op } from "sequelize";



// Fetch Dispute Overview
const fetchDisputeOverview = catchAsync(async (req, res) => {
    // @route   : GET /api/v2/disputes/:disputeId/overview
    try {
        // Step 1 : Extract the dispute Id from request params
        const { disputeId } = req.params;

        // Step 2 : Validate the Dispute Id
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }

        // Step 3 : Call the dispute model
        let dispute = await Dispute.findOne({ where: { customId: disputeId }, attributes: ['id', 'customId', 'gateway', 'status', 'state', 'statusUpdatedAt', 'dueDate', 'amount', 'workflowStage'], raw: true });

        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Dispute'));
        }

        dispute = {
            id: dispute?.id,
            disputeId: dispute?.customId,
            status: dispute?.state,
            chargeBackDate: dispute?.statusUpdatedAt,
            gateway: dispute?.gateway,
            amount: dispute?.amount,
            respondBy: dispute?.dueDate,
            currentStage: dispute?.workflowStage,
        }
        // Step 4 : refactor or return the payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Dispute Overview Fetch Successfully',
                {
                    dispute
                },
                false
            )
        )
    } catch (error) {
        console.log("Error in Fetch dispute Overview Controller: ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed To Fetch Dispute Overview',
                {
                    message: error?.message,
                },
                false
            )
        )
    }

});

// Fetch Dispute Details
const fetchDisputeDetails = catchAsync(async (req, res) => {
    // @route   : GET /api/v2/disputes/:disputeId/details
    try {
        // Step 1 : Extract the dispute Id from request params
        const { disputeId } = req.params;

        // Step 2 : Validate the Dispute Id
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }

        // Step 3 : Call the dispute model
        let dispute = await Dispute.findOne({
            where: { customId: disputeId },
            attributes: ['id', 'customId', 'gateway', 'status', 'paymentId', 'state', 'reason', 'type', 'statusUpdatedAt', 'dueDate', 'amount', 'workflowStage', 'explanation', 'notes', 'contest_reason', 'createdAt'],
            raw: true
        });

        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Dispute'));
        }

        dispute = {
            id: dispute?.id,
            disputeId: dispute?.customId,
            transactionId: dispute?.paymentId,
            status: dispute?.state,
            reason: dispute?.reason,
            type: dispute?.type,
            statusUpdatedAt: dispute?.statusUpdatedAt,
            respondBy: dispute?.dueDate,
            gateway: dispute?.gateway,
            amount: dispute?.amount,
            currency: dispute?.currency,
            currentStage: dispute?.workflowStage,
            explanation: dispute?.explanation || "",
            notes: dispute?.notes || "",
            contestReason: dispute?.contest_reason || ""
        }
        // Step 4 : refactor or return the payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Dispute Details Fetch Successfully',
                {
                    dispute
                },
                false
            )
        )
    } catch (error) {
        console.log("Error in Fetch dispute Details Controller: ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed To Fetch Dispute Details',
                {
                    message: error?.message,
                },
                false
            )
        )
    }

});

// Update Dispute Details ( e.g : explanation, reason Contest, Internal Notes)
const updateDisputeDetails = catchAsync(async (req, res) => {
    // @route   : PATCH /api/v2/disputes/:disputeId/details
    try {

        // Step 1 : Extract the dispute Id and details from request params
        const { disputeId } = req.params;
        const { explanation, contestReason, notes } = req.body;

        // Step 2 : Validate the Dispute Id
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }

        // Step 3 : Call the dispute model
        let dispute = await Dispute.findOne({
            where: { customId: disputeId },
            attributes: ['id'],
            raw: true
        });

        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Dispute'));
        }

        // Step 4 : Generate Update Dispute Payload
        const updateDisputePayload = {};
        if (explanation) {
            updateDisputePayload.explanation = explanation;
        }
        if (notes) {
            updateDisputePayload.notes = notes;
        }
        if (contestReason) {
            updateDisputePayload.contest_reason = contestReason;
        }

        if (Object.keys(updateDisputePayload).length === 0) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('At least one field (explanation, contestReason, notes)'));
        }

        await Dispute.update(updateDisputePayload, { where: { customId: disputeId } });

        dispute = {
            ...dispute,
            ...updateDisputePayload
        };
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Dispute Details Updated Successfully',
                {
                    dispute
                },
                true
            )
        )
    } catch (error) {
        console.log("Error in Update dispute Details Controller: ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed To Update Dispute Details',
                {
                    message: error?.message,
                },
                false
            )
        )
    }

});

// Fetch Dispute Transaction
const fetchDisputeTransaction = catchAsync(async (req, res) => {
    // @route   : GET /api/v2/disputes/:disputeId/transaction
    try {
        // Step 1 : Extract the dispute Id from request params
        const { disputeId } = req.params;

        // Step 2 : Validate the Dispute Id
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }

        // Step 3 : Call the dispute model
        let dispute = await Dispute.findOne({
            where: { customId: disputeId },
            attributes: ['id', 'customId', 'gateway', 'disputeId', 'paymentId', 'amount', 'statusUpdatedAt', 'dueDate', 'createdAt', 'workflowStage'],
            raw: true
        });

        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Dispute'));
        }
        // Formatted The Payload
        dispute = {
            id: dispute?.id,
            disputeId: dispute?.customId,
            transactionId: dispute?.paymentId,
            gatewayDisputeId: dispute?.disputeId,
            statusUpdatedAt: dispute?.statusUpdatedAt,
            respondBy: dispute?.dueDate,
            gateway: dispute?.gateway,
            amount: dispute?.amount,
            currentStage: dispute?.workflowStage,
            createdAt: dispute?.createdAt,
        }
        console.log("details : ", dispute)

        // Fetch Time Line
        let disputeTimeLine = await DisputeHistory.findAll({
            where: { disputeId: dispute?.id },
            attributes: ['id', 'updatedStatus', 'updatedEvent', 'statusUpdateAt'],
            order: [['createdAt', 'ASC']],
            raw: true
        });

        // Formatted The Payload
        disputeTimeLine = disputeTimeLine.map((record) => {
            return {
                id: record?.id,
                gatewayDisputeStatus: record?.updatedStatus?.split('_')?.map((word) => word[0]?.toUpperCase() + word?.slice(1)).join(" "),
                gatewayEvent: record?.updatedEvent?.split('_')?.map((word) => word[0]?.toUpperCase() + word?.slice(1)).join(" "),
                statusUpdatedAt: record?.statusUpdateAt,
            }
        })

        // Step 4 : refactor or return the payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Dispute Time line Fetch Successfully',
                {
                    currentPhase: dispute?.workflowStage,
                    dispute,
                    timeLine: disputeTimeLine
                },
                false
            )
        )
    } catch (error) {
        console.log("Error in Fetch dispute Transaction Controller: ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed To Fetch Dispute Transaction',
                {
                    message: error?.message,
                },
                false
            )
        )
    }

});

// Add File into dispute Attachments
const addFileIntoDisputeAttachments = catchAsync(async (req, res) => {
    // @route : POST /api/v2/disputes/:disputeId/attachments
    try {

        // Step 1 : Extract the file details and file upload fields
        const { title, description } = req.body;
        const { disputeId } = req.params;
        const { userId, userRef } = req.userRole;

        // Step 2 : Validate the Details for File and fields

        // Validate the user
        if (!helpers.isValidUUIDv4(userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.UnAuthorizedField('User'));
        }
        if (!userRef || !['MERCHANT', 'ANALYST'].includes(userRef.toUpperCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.UnAuthorizedField('User'));
        }
        // Validate dispute id is custom id or not
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }
        // Validate title
        if (_.isEmpty(title)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('title'));
        }
        // validate description
        if (_.isEmpty(description)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('description'));
        }
        // validate description
        if (_.isEmpty(disputeId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('description'));
        }


        // Check File Uploaded Or Not
        if (!req.files?.['dispute_doc']?.[0]) {
            throw new AppError(statusCodes.BAD_REQUEST, 'File Not Uploaded, Please Upload a Document.');
        }

        // Step 3 : Fetch Dispute Details

        const [dispute, lastAddedRecord] = await Promise.all([
            // Fetch Dispute
            Dispute.findOne({
                where: { customId: disputeId },
                attributes: ['id', 'merchantId', 'businessId', 'analystId', 'state', 'workflowStage'],
                raw: true
            }),

            // Fetch latest added attachment to dispute
            Attachment.findOne({
                where: { customDisputeId: disputeId },
                attributes: ['id', 'isLatest', 'status', 'stage', 'createdAt'],
                order: [['createdAt', 'DESC']],
                raw: true
            })
        ]);
        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Dispute'));
        }

        // Step 4 : Generate a Payload to store the file record

        const uploadedFile = req.files?.['dispute_doc']?.[0];

        // 4.1 :formatting the fields of File Upload
        const fileFormat = uploadedFile?.originalname.split('.').pop().toLowerCase();
        const sizeInBytes = uploadedFile.size;
        let sizeType, size;
        if (sizeInBytes < 1024 * 1024) {
            // Less than 1 MB
            sizeType = 'KB';
            size = +(sizeInBytes / 1024).toFixed(2); // Convert to KB, 2 decimal places
        } else {
            // 1 MB or more
            sizeType = 'MB';
            size = +(sizeInBytes / (1024 * 1024)).toFixed(2); // Convert to MB, 2 decimal places
        }

        // 4.2 : format the payload
        const payload = {
            merchantId: dispute?.merchantId,
            businessId: dispute?.businessId,
            disputeId: dispute?.id,
            customDisputeId: disputeId,
            userUploadedId: userId,
            userUploadedRef: userRef,
            fileName: uploadedFile?.originalname,
            type: title,
            url: uploadedFile?.location,
            description,
            sizeType,
            size,
            isLatest: true,
            format: fileFormat,
            status: dispute?.state,
            stage: dispute?.workflowStage
        }

        // Step 5 : Fetch Existing Record to check the Documents attached previously or not

        if (lastAddedRecord && (payload?.status !== lastAddedRecord?.status || payload?.stage !== lastAddedRecord?.stage)) {
            payload.isLatest = true;

            // Update all attachments for this disputeId where isLatest is true, set to false
            await Attachment.update(
                { isLatest: false },
                { where: { customDisputeId: disputeId, isLatest: true } }
            );
        }

        // Step 6 : Add new file document into dispute attachment

        const disputeAttachedFile = await Attachment.create(payload);
        if (_.isEmpty(disputeAttachedFile)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Document Record'));
        }

        // Step 7 : Return payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'File uploaded Successfully',
                {
                    disputeFile: disputeAttachedFile
                },
                true
            )
        )
    } catch (error) {
        console.log("Error in add file into Dispute Attachments ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed To add file into dispute',
                {
                    message: error?.message,
                },
                false
            )
        )
    }

});

// Fetch Dispute Newly and Previously Attached Files
const fetchDisputesAttachments = catchAsync(async (req, res) => {
    // @route : GET /api/v2/disputes/:disputeId/attachments
    try {
        // Step 1 : Extract the dispute id and user Data from request
        const { disputeId } = req.params;

        // Step 2 : Validate the dispute Id
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }
        // Step 3 : Check Dispute Exist or not
        const dispute = await Dispute.findOne({
            where: { customId: disputeId },
            attributes: ['id', 'workflowStage'],
            raw: true
        });
        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Dispute'));
        }

        // Step 4 : Fetch Dispute Attachments
        const disputeAttachments = await Attachment.findAll({
            where: { customDisputeId: disputeId },
            attributes: {
                exclude: [
                    'merchantId',
                    'businessId',
                    'userUploadedId',
                    'userUploadedRef',
                    'disputeId',
                    'updatedAt'
                ]
            },
            raw: true
        });

        // Step 5 : Refactor Dispute Attachments based on newly added or previously added format

        const newlyAddedAttachments = disputeAttachments?.filter((attachment) => attachment?.isLatest)?.map((attachment) => {
            return {
                id: attachment?.id,
                disputeId: attachment?.customDisputeId,
                url: attachment?.url,
                type: attachment?.type,
                fileName: attachment?.fileName,
                status: attachment?.status,
                description: attachment?.description,
                lastModified: attachment?.createdAt,
                size: `${attachment?.size}${attachment?.sizeType}`,
                format: attachment?.format,
                stage: attachment?.stage
            }
        });
        const previouslyAddedAttachments = disputeAttachments?.filter((attachment) => !attachment?.isLatest)?.map((attachment) => {
            return {
                id: attachment?.id,
                disputeId: attachment?.customDisputeId,
                url: attachment?.url,
                type: attachment?.type,
                fileName: attachment?.fileName,
                status: attachment?.status,
                description: attachment?.description,
                lastModified: attachment?.createdAt,
                size: `${attachment?.size}${attachment?.sizeType}`,
                format: attachment?.format,
                stage: attachment?.stage
            }
        });

        newlyAddedAttachments.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        previouslyAddedAttachments.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

        // Step 6 : Return payload


        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Dispute Attachments Fetched Successfully',
                {
                    currentPhase: dispute.workflowStage,
                    //* Upcoming stage Case
                    newlyAddedAttachments,
                    previouslyAddedAttachments
                },
                true
            )
        )
    } catch (error) {
        console.log("Error in Fetching Newly and Previously Attached Files : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed To Fetch Dispute Attachments',
                {
                    message: error?.message,
                },
                false
            )
        )
    }
});


// Controller to submit and resubmit the dispute documents for Analyst and merchant
const submitOrResubmitDisputeAttachments = catchAsync(async (req, res) => {
    // @route   : PATCH /api/v2/disputes/:disputeId/attachments/submit

    try {

        const { userRef } = req.userRole;

        if (!['MERCHANT', 'ANALYST'].includes(userRef)) {
            throw new AppError(statusCodes.FORBIDDEN, AppErrorCode.YouAreNotAuthorized);
        }


        // Step 1 : Extract the dispute id from request params
        const { disputeId } = req.params;

        // Validate Dispute Id
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }

        // Step 2 : Check Dispute is Exist Or not
        const dispute = await Dispute.findOne({
            where: { customId: disputeId },
            attributes: ['id', 'lastStage', 'lastStageAt', 'updatedStage', 'updatedStageAt', 'workflowStage'],
            raw: true
        });
        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Dispute'));
        }

        // Step 3 : Validating right order to submit or resubmit documents

        // If It is Already Accepted then no need to submit
        if (dispute?.workflowStage === 'ACCEPTED') {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.DocumentsAlreadyAccepted);
        }

        const updateStagePayload = {};

        // Check if already submitted 
        if (dispute?.workflowStage === 'SUBMITTED') {
            updateStagePayload.updatedStageAt = new Date(new Date()?.toISOString());
            updateStagePayload.workflowStage = 'SUBMITTED';
        }

        // Update stage for submit and resubmit
        if (dispute?.workflowStage === 'PENDING' || dispute?.workflowStage === 'REJECTED') {
            updateStagePayload.lastStage = dispute?.updatedStage;
            updateStagePayload.lastStageAt = dispute?.updatedStageAt ? new Date(dispute?.updatedStageAt) : null;
            updateStagePayload.updatedStage = dispute?.workflowStage === 'REJECTED' ? 'RESUBMITTED' : 'SUBMITTED';
            updateStagePayload.updatedStageAt = new Date(new Date()?.toISOString());
            updateStagePayload.workflowStage = dispute?.workflowStage === 'REJECTED' ? 'RESUBMITTED' : 'SUBMITTED';
        }

        if (dispute?.workflowStage === 'RESUBMITTED') {
            updateStagePayload.updatedStageAt = new Date(new Date()?.toISOString());
            updateStagePayload.workflowStage = 'RESUBMITTED';
        }

        // Step 4 : Update the workflow stage to SUBMITTED
        await Dispute.update(
            updateStagePayload,
            { where: { customId: disputeId } }
        );


        //*** Sent notification about status changed 
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Dispute documents submitted successfully',
                {
                    disputeId,
                    newStage: updateStagePayload.workflowStage
                },
                true
            )
        );

    } catch (error) {
        console.log("Error in Submit or Resubmit Document Controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed Submit Dispute Documents',
                {
                    message: error?.message,
                },
                false
            )
        )
    }
});


// Accept  the submitted or resubmitted dispute by Merchant or Manager
const acceptAnalystSubmittedDispute = catchAsync(async (req, res) => {
    // @route   : PATCH /api/v2/disputes/:disputeId/accept

    try {
        const { userRef } = req.userRole;

        if (!['MERCHANT', 'MANAGER'].includes(userRef)) {
            throw new AppError(statusCodes.FORBIDDEN, AppErrorCode.YouAreNotAuthorized);
        }


        // Step 1 : Extract the dispute id and phase from request params
        const { disputeId } = req.params;

        // Validate Dispute Id
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }


        // Step 2 : Check Dispute is Exist Or not
        const dispute = await Dispute.findOne({
            where: { customId: disputeId },
            attributes: ['id', 'lastStage', 'lastStageAt', 'updatedStage', 'updatedStageAt', 'workflowStage'],
            raw: true
        });
        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Dispute'));
        }


        // Throw Error when the dispute stage is not in Valid phase to accept or reject
        if (['PENDING', 'ACCEPTED', 'REJECTED'].includes(dispute?.workflowStage)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.disputeCannotAccept)
        }

        const updateDisputePayload = {};

        updateDisputePayload.lastStage = dispute.updatedStage;
        updateDisputePayload.lastStageAt = new Date(dispute?.updatedStageAt);
        updateDisputePayload.updatedStage = 'ACCEPTED';
        updateDisputePayload.updatedStageAt = new Date(new Date()?.toISOString());

        updateDisputePayload.workflowStage = 'ACCEPTED';


        await Dispute.update(
            updateDisputePayload,
            { where: { customId: disputeId } }
        );

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Dispute accepted successfully',
                {
                    disputeId,
                    newStage: updateDisputePayload.workflowStage
                },
                true
            )
        );



    } catch (error) {
        console.log("Error in Accept the dispute Controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed to Accept Dispute',
                {
                    message: error?.message,
                },
                false
            )
        )
    }

});

// Reject  the submitted or resubmitted dispute by Merchant or Manager
const rejectAnalystSubmittedDispute = catchAsync(async (req, res) => {
    // @route   : PATCH /api/v2/disputes/:disputeId/reject
    try {
        const { userRef, userId } = req.userRole;

        if (!['MERCHANT', 'MANAGER'].includes(userRef)) {
            throw new AppError(statusCodes.FORBIDDEN, AppErrorCode.YouAreNotAuthorized);
        }
        // Step 1 : Extract the Reject payload fields and disputeId from request
        const { feedback, comments, fileNames } = req.body;
        const { disputeId } = req.params;

        // Step 2 : Validate the fields and disputeId

        // Validate Dispute Id
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }

        // Validate Feedback
        if (_.isEmpty(feedback)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('feedback'));
        }
        // Validate comments
        if (_.isEmpty(comments)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('comments'));
        }
        // Validate fileNames
        if (_.isEmpty(fileNames)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('fileNames'));
        }

        // Step 3 : Check Dispute is Exist or not and reject payload if exist
        const dispute = await Dispute.findOne({
            where: { customId: disputeId },
            attributes: ['id', 'businessId', 'lastStage', 'lastStageAt', 'updatedStage', 'updatedStageAt', 'workflowStage', 'feedback'],
            raw: true
        });
        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Dispute'));
        }


        // Step 4 : Throw Error when the dispute stage is not in Valid phase to accept or reject
        if (['PENDING', 'ACCEPTED', 'REJECTED'].includes(dispute?.workflowStage)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.disputeCannotField('Reject'));
        }

        // Step 5 : If dispute Rejected Before then Update the feedback
        let rejectedFeed = await RejectFeedback.findOne({
            where: { disputeId: dispute?.id },
        });

        // Step 6 : Generate Reject Payload
        const rejectPayload = {
            businessId: dispute?.businessId,
            disputeId: dispute?.id,
            userRejectedId: userId,
            userRejectedRef: userRef,
            rejectedAt: new Date(),
            feedback,
            comments,
            fileNames,
        }


        // Step 7 : Create a Reject Feedback Record If Not Else Update The Existing Record
        if (_.isEmpty(rejectedFeed)) {

            const rejectRecord = await RejectFeedback.create(rejectPayload);
            if (_.isEmpty(rejectRecord)) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Reject Feedback'));
            }

        } else {
            rejectedFeed.userRejectedId = rejectPayload.userRejectedId;
            rejectedFeed.userRejectedRef = rejectPayload.userRejectedRef;
            rejectedFeed.rejectedAt = rejectPayload.rejectedAt;
            rejectedFeed.feedback = rejectPayload.feedback;
            rejectedFeed.comments = rejectPayload.comments;
            rejectedFeed.fileNames = rejectPayload.fileNames;

            rejectedFeed = await rejectedFeed.save();
        }


        const updateDisputePayload = {
            lastStage: dispute.updatedStage,
            lastStageAt: new Date(dispute?.updatedStageAt),
            updatedStage: 'REJECTED',
            updatedStageAt: new Date(new Date()?.toISOString()),
            workflowStage: 'REJECTED',
            feedback,
        }

        // Step 8 : Update Dispute Details with feedback
        await Dispute.update(
            updateDisputePayload,
            { where: { customId: disputeId } }
        );

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Dispute rejected successfully',
                {
                    disputeId,
                    newStage: updateDisputePayload.workflowStage,
                    feedback: updateDisputePayload.feedback
                },
                true
            )
        );

    } catch (error) {
        console.log("Error in Reject the dispute Controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed to Reject Dispute',
                {
                    message: error?.message,
                },
                false
            )
        )
    }
});


// Fetch Rejected Dispute Feedback
const fetchRejectedDisputeFeedback = catchAsync(async (req, res) => {
    // @route   : GET /api/v2/disputes/:disputeId/reject-feedback
    try {
        // Step 1 : Extract the Reject payload fields and disputeId from request
        const { disputeId } = req.params;

        // Step 2 : Validate the fields and disputeId

        // Validate Dispute Id
        if (!helpers.isValidCustomId(disputeId, 'DSP')) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('dispute Id'));
        }

        // Step 3 : Check Dispute is Exist or not
        const dispute = await Dispute.findOne({
            where: { customId: disputeId },
            attributes: ['id'],
            raw: true
        });
        if (_.isEmpty(dispute)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Dispute'));
        }

        // Step 4 : Fetch The Rejected Feedback
        const rejectedFeedback = await RejectFeedback.findOne({
            where: { disputeId: dispute?.id },
            raw: true
        });

        if (_.isEmpty(rejectedFeedback)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Rejected Feedback'));
        }


        // Step 5 : Fetch the Rejected User Details based on userRejectedRef
        let rejectedUser = { role: "", name: "" };
        if (rejectedFeedback?.userRejectedRef === 'MERCHANT') {
            rejectedUser.role = "Merchant";
            const merchant = await Merchant.findByPk(rejectedFeedback?.userRejectedId, {
                attributes: ['id', 'name'],
                raw: true
            });

            rejectedUser.name = merchant?.name || "Unknown Merchant";
        }
        else {
            rejectedUser.role = "Manager";
            const manager = await Manager.findByPk(rejectedFeedback?.userRejectedId, {
                attributes: ['id', 'firstName', 'lastName'],
                raw: true
            });

            rejectedUser.name = manager ? `${manager?.firstName} ${manager?.lastName}` : 'Unknown Manager';
        }


        // Step 6 : Format the Rejected Feedback Data
        const feedbackData = {
            id: rejectedFeedback?.id,
            disputeId: rejectedFeedback?.disputeId,
            userRejectedId: rejectedFeedback?.userRejectedId,
            userRejectedRef: rejectedFeedback?.userRejectedRef,
            rejectedUserRole: rejectedUser?.role,
            rejectedUserName: rejectedUser?.name,
            rejectedAt: rejectedFeedback?.rejectedAt,
            feedback: rejectedFeedback?.feedback,
            comments: rejectedFeedback?.comments,
            fileNames: rejectedFeedback?.fileNames,
        };

        // Step 7 : Return the Rejected Feedback Data
        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                'Rejected Dispute Feedback Fetched Successfully',
                {
                    feedback: feedbackData
                },
                true
            )
        )
    } catch (error) {
        console.log("Error in Fetch Rejected Dispute Feedback Controller : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                'Failed to Fetch Rejected Dispute Feedback',
                {
                    message: error?.message,
                },
                false
            )
        )

    }
});


// Get Uploaded Dispute Attachments Drive
const getUploadedDrive = catchAsync(async (req, res) => {
    // @route    : GET /api/v2/disputes/attachments/drive
    try {

        // Check the BusinessId from the Requested User
        const { businessId } = req;

        // Validate User
        if (_.isEmpty(req.userRole)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.UnAuthorizedField('User'));
        }
        console.log("inside api")

        // If No Business Id then Return empty response
        if (_.isEmpty(businessId)) {
            console.log("inside response");
            return res.status(statusCodes.OK).json(
                success_response(
                    statusCodes.OK,
                    "Fetched Uploaded Drive Successfully",
                    {
                        totalAttachments: 0,
                        totalPages: 0,
                        page: 0,
                        limit: 10,
                        attachments: []
                    },
                    true
                ));
        }

        // validate business id is uuid or not
        if (!helpers.isValidUUIDv4(businessId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('businessId'));
        }
        // Validate user id
        if (!helpers.isValidUUIDv4(req.userRole?.userId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('userId'));
        }

        // Step 1: Extract The disputeId and filter fields from the Query
        const { disputeId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        console.log("Skip :", skip);

        // Step 2 : Validate the Dispute id is in Right format or not
        if (disputeId && !(/(\d|DSP)/).test(disputeId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.InvalidFieldFormat('Dispute Id'));
        }

        // Step 3 : Generate Payload for fetching drive based on User Access
        const filters = {
            businessId,
        }

        // 3.1 : Add Analyst filter if the requested user is Analyst, for their respective Dispute Attachments
        if (req.userRole?.userRef === "ANALYST") {
            filters.userUploadedId = req.userRole?.userId;
        }

        // 3.2 : add dispute Id filter
        if (disputeId) {
            filters.customDisputeId = { [Op.iLike]: `%${disputeId}%` };
        }


        // Step 4 : Call The Dispute Query

        let { count: totalAttachments, rows: attachments } = await Attachment.findAndCountAll({
            where: filters,
            order: [['updatedAt', 'DESC']],
            offset: skip,
            limit,
            raw: true,
        });
        const totalPages = Math.ceil(totalAttachments / limit);

        // Step 5 : Filter out unique ids for Analyst to fetch the details
        const analystIds = [...
            (
                new Set(
                    attachments?.filter(
                        (attachment) => attachment?.userUploadedRef === 'ANALYST')
                        ?.map((user) => user?.userUploadedId)
                )
            )
        ];

        // Step 6 : Filter out unique ids for merchant to fetch the details
        const merchantsIds = [...(new Set(attachments?.filter((attachment) => attachment?.userUploadedRef === 'MERCHANT')?.map((user) => user?.userUploadedId)))];


        let users = [];

        // Step 7 : Call the db and fetch the details and merge in users 
        if (analystIds.length > 0) {
            const analysts = await Analyst.findAll({
                where: { id: { [Op.in]: analystIds } },
                attributes: ['id', 'staffId', 'firstName', 'lastName'],
                raw: true
            });
            users = [...users, ...analysts.map((analyst) => ({
                id: analyst.id,
                customId: analyst?.staffId,
                name: `${analyst.firstName} ${analyst.lastName}`,
                role: 'Analyst'
            }))];
        }
        if (merchantsIds.length > 0) {
            const merchants = await Merchant.findAll({
                where: { id: { [Op.in]: merchantsIds } },
                attributes: ['id', 'merchantId', 'name'],
                raw: true
            });
            users = [...users, ...merchants.map((merchant) => ({
                id: merchant.id,
                customId: merchant?.merchantId,
                name: merchant.name,
                role: 'Merchant'
            }))];
        }

        // Step 8 : Refactor the attachments to include user details and payload
        attachments = attachments.map((attachment) => {
            const user = users.find((user) => user.id === attachment.userUploadedId);
            return {
                id: attachment?.id,
                disputeId: attachment?.customDisputeId,
                userId: attachment?.userUploadedId,
                userCustomId: user?.customId || "",
                userName: user?.name || "",
                userRole: attachment?.userUploadedRef,
                type: attachment?.type,
                fileName: attachment?.fileName,
                url: attachment?.url,
                lastModified: attachment?.updatedAt,
                size: `${attachment?.size}${attachment?.sizeType}`,
                format: attachment?.format,
                status: attachment?.status,
                stage: attachment?.stage
            }
        });

        // Step 9 : Return the Dispute Payload
        const payload = {
            totalAttachments,
            totalPages,
            page,
            limit,
            attachments
        }

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Attachment Uploaded Drive Fetched Successfully",
                payload,
                true
            )
        )
    } catch (error) {
        console.log("Error in Fetching Uploaded Drive : ", error?.message);
        return res.status(error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR).json(
            failed_response(
                error?.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
                "Failed To Fetch Dispute Uploaded Drive",
                { message: error?.message },
                false
            )
        );
    }
});

const disputeController = {
    fetchDisputeOverview,
    fetchDisputeDetails,
    updateDisputeDetails,
    fetchDisputeTransaction,
    addFileIntoDisputeAttachments,
    fetchDisputesAttachments,
    submitOrResubmitDisputeAttachments,
    acceptAnalystSubmittedDispute,
    rejectAnalystSubmittedDispute,
    fetchRejectedDisputeFeedback,
    getUploadedDrive
};


export default disputeController;