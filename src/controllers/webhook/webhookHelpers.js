import StaffAssignmentState from "../../models/staffAssignState.model.js";
import sequelize from '../../config/database.js';
import { disputeStates, getDisputeInternalState } from "../../constants/disputeStates.js";



const Gateway_Ip_Addresses = {
    razorpay: [
        '52.66.75.174',
        '52.66.76.63',
        '52.66.151.218',
        '35.154.217.40',
        '35.154.22.73',
        '35.154.143.15',
        '13.126.199.247',
        '13.126.238.192',
        '13.232.194.134',
        '18.96.225.0/26',
        '18.99.161.0/26',
    ],
    cashfree: [
        ''
    ]
}
function DetectPaymentGateway(headers, body) {
    // @desc : Detect the listed payment gateways
    // 1. Razorpay
    if (headers['x-razorpay-signature']) return 'razorpay';

    if (body?.event?.includes('dispute')) return 'razorpay';

    // 2. Cashfree
    /*
    {
        "content-length": "1099",
        "x-webhook-attempt": "1",
        "content-type": "application/json",
        "x-webhook-signature": "07r5C3VMwsGYeldGOCYxe5zoHhIN1zLfa8O0U/yngHI=",
        "x-idempotency-key": "n9rn7079wqXcse3GEDEXCYle9ajXmU0SUQY8zrUNAlc=",
        "x-webhook-timestamp": "1746427759733",
        "x-webhook-version": "2025-01-01"
    }
    */
    if (headers['x-webhook-signature']) return 'cashfree';

    return null;
}

const getStatusIntoHumanReadableFormat = (status) => {
    // @desc : Convert the status to human readable format
    return status?.split('_')?.map((s) => s[0]?.toUpperCase() + s.slice(1)?.toLowerCase())?.join(' ') || 'Initiated';
}

const RazorpayDisputeParser = (payload) => {

    // @desc : Parse the razorpay payload and pull important fields

    const disEvent = payload?.event?.split('.')?.reverse()?.[0];

    const disputeData = payload?.payload?.dispute;
    // const paymentData = payload?.payload?.payment;
    const updatedDate = new Date(disputeData?.entity?.created_at * 1000);
    const respondBy = new Date(disputeData?.entity?.respond_by * 1000);

    const reason_code = disputeData?.entity?.reason_code;
    const reasonDesc = reason_code?.split('_')?.map((word) => word?.[0]?.toUpperCase() + word?.slice(1)).join(' ');


    // Configuration for dispute internal state
    const stateValue = disputeData?.entity?.status?.toLowerCase();
    const internalState = getDisputeInternalState(stateValue) || disputeStates.INITIATED;


    const dispute = {
        event: disEvent,                                         // [ 'created', 'won', 'lost', 'closed', 'under_review', 'action_required' ]
        disputeId: disputeData?.entity?.id,                      // Ex: disp_EsIAlDcoUr8CaQ
        paymentId: disputeData?.entity?.payment_id,              // Ex: pay_EFtmUsbwpXwBHI
        amount: disputeData?.entity?.amount,                     // Ex: 39000
        currency: disputeData?.entity?.currency,                 // Ex : INR
        // paymentMode: paymentData?.entity?.method || null,     // Ex : card  
        statusUpdatedAt: updatedDate,                            // Ex : 1589907957 (Unix Timestamp) --> seconds (1589907957)  * milliseconds ( 1000 ) = new Date( seconds * milliseconds )  
        dueDate: respondBy,                                      // Ex : 1589907957 (Unix Timestamp) --> seconds (1589907957)  * milliseconds ( 1000 ) = new Date( seconds * milliseconds )  
        reasonCode: reason_code,                                 // EX : goods_or_services_not_received_or_partially_received
        reasonDescription: reasonDesc,                           // Ex : Goods Or Services Not Received Or Partially Received
        status: getStatusIntoHumanReadableFormat(disputeData?.entity?.status),                     // Ex : open, won, lost, closed, under_review
        type: disputeData?.entity?.phase || 'chargeback',        // Ex :  chargeback, fraud
        state: getStatusIntoHumanReadableFormat(internalState),
    }
    return dispute;

}

function getInternalDisputeStatusForCashfree(rawStatus = 'initiated') {
    const normalized = rawStatus.toUpperCase();

    const suffixMappings = [
        {
            suffix: '_CREATED',
            internal_status: 'action_required',
            internal_sub_status: 'awaiting_merchant_response',
            description: 'Dispute created; merchant action required.'
        },
        {
            suffix: '_DOCS_RECEIVED',
            internal_status: 'under_review',
            internal_sub_status: 'evidence_submitted',
            description: 'Evidence received and under review.'
        },
        {
            suffix: '_UNDER_REVIEW',
            internal_status: 'under_review',
            internal_sub_status: 'reviewing_evidence',
            description: 'Dispute is under evaluation by issuer/gateway.'
        },
        {
            suffix: '_MERCHANT_WON',
            internal_status: 'won',
            internal_sub_status: 'auto_resolved',
            description: 'Merchant won the dispute.'
        },
        {
            suffix: '_MERCHANT_LOST',
            internal_status: 'lost',
            internal_sub_status: 'evidence_invalid',
            description: 'Merchant lost the dispute.'
        },
        {
            suffix: '_MERCHANT_ACCEPTED',
            internal_status: 'accepted',
            internal_sub_status: 'accepted_by_merchant',
            description: 'Merchant accepted the dispute.'
        },
        {
            suffix: '_INSUFFICIENT_EVIDENCE',
            internal_status: 'action_required',
            internal_sub_status: 'evidence_rejected',
            description: 'Evidence was deemed insufficient; further action may be required.'
        }
    ];

    const match = suffixMappings.find(m => normalized.endsWith(m.suffix));

    return match ? disputeStates[match?.internal_status?.toUpperCase()] : 'INITIATED';
}

const CashfreeDisputeParser = (payload) => {

    // @desc : Parse the razorpay payload and pull important fields

    const disEvent = payload?.type?.split('_')?.reverse()?.[0]?.toLowerCase();
    const disputeData = payload?.data?.dispute || {};
    const orderData = payload?.data?.order_details || {};

    const updatedDate = new Date(payload?.event_time);
    const respondBy = new Date(payload?.data?.dispute?.respond_by);


    // Configuration for dispute internal state
    const stateValue = disputeData?.dispute_status;
    const internalState = getInternalDisputeStatusForCashfree(stateValue || 'initiated') || disputeStates.INITIATED;

    const dispute = {
        event: disEvent,                                                // [ 'created', 'updated', 'closed']
        disputeId: disputeData?.dispute_id?.toString(),                 // Ex: 433475258
        paymentId: orderData?.cf_payment_id?.toString(),                // Ex: 885473311
        amount: disputeData?.dispute_amount,                            // Ex: 39000
        currency: disputeData?.dispute_amount_currency,                 // Ex : INR                                             // Ex : card --> no paymentMode field 
        statusUpdatedAt: updatedDate,                                   // Ex :  "2023-06-15T21:50:04+05:30"
        dueDate: respondBy,                                             // Ex : "2023-06-18T23:59:59+05:30"
        reasonCode: disputeData?.reason_code,                           // EX : "1402"
        reasonDescription: disputeData?.reason_description,             // Ex : Duplicate Processing
        status: getStatusIntoHumanReadableFormat(disputeData?.dispute_status),                            // Ex : CHARGEBACK_MERCHANT_WON, PRE_ARBITRATION_CREATED,DISPUTE_CREATED
        type: disputeData?.dispute_type?.toLowerCase() || 'chargeback',  // Ex : DISPUTE, CHARGEBACK, PRE_ARBITRATION, ARBITRATION, RETRIEVAL
        state: getStatusIntoHumanReadableFormat(internalState),
    }
    return dispute;
}

function OrchestratorGatewayParser(gateway, rawPayload) {
    switch (gateway) {
        case 'razorpay':
            return RazorpayDisputeParser(rawPayload);
        case 'cashfree':
            return CashfreeDisputeParser(rawPayload);
        default:
            // return `Unsupported gateway: ${gateway}`;
            return null;
    }
}


const getNextRoundRobinStaffWithoutLocking = async (staffIds, merchantId, options) => {
    if (!Array.isArray(staffIds) || staffIds.length === 0) {
        throw new Error('Staff list is empty or invalid.');
    }

    // Step 1: Fetch the current assignment state for the merchant
    const existingState = await StaffAssignmentState.findOne({
        where: { merchantId },
        attributes: ['id', 'lastStaffAssigned'],
        raw: true,
        transaction: options.transaction
    });

    // Step 2: Sort staff IDs to maintain deterministic ordering
    const sortedStaffIds = [...staffIds].sort((a, b) => a - b);

    // Step 3: If no assignment state exists, initialize with first staff
    if (!existingState) {
        const firstStaffId = sortedStaffIds[0];

        const newState = await StaffAssignmentState.create({
            merchantId,
            lastStaffAssigned: firstStaffId
        }, { transaction: options.transaction });

        if (!newState) {
            throw new Error('Failed to create initial staff assignment state.');
        }

        return firstStaffId;
    }

    // Step 4: Calculate next staff in round robin
    const lastIndex = sortedStaffIds.indexOf(existingState.lastStaffAssigned);
    const nextIndex = (lastIndex + 1) % sortedStaffIds.length;

    return sortedStaffIds[nextIndex];
};

const getNextRoundRobinStaffWithLocking = async (staffIds, merchantId) => {
    if (!Array.isArray(staffIds) || staffIds.length === 0) {
        throw new Error('Staff list is empty or invalid.');
    }

    // Step 1 : Sort staff Ids
    const sortedStaffIds = [...staffIds].sort((a, b) => a - b);

    // Step 2 : Start DB transaction
    const t = await sequelize.transaction();
    // return await Sequelize.transaction(async (t) => {
    // Step 3 : Lock the row for update (to avoid race conditions)
    let state = await StaffAssignmentState.findOne({
        where: { merchantId },
        attributes: ['id', 'lastStaffAssigned'],
        lock: t.LOCK.UPDATE,
        transaction: t
    });

    // Step 4 : First-time setup if not found
    if (!state) {
        const firstStaffId = sortedStaffIds[0];

        state = await StaffAssignmentState.create({
            merchantId,
            lastStaffAssigned: firstStaffId
        }, { transaction: t });
        // t.commit();
        return firstStaffId;
    }

    // Step 5 : Compute next staff in the rotation
    const lastAssignedId = state.lastStaffAssigned;
    const lastIndex = sortedStaffIds.indexOf(lastAssignedId);
    const nextIndex = (lastIndex + 1) % sortedStaffIds.length;
    const nextStaffId = sortedStaffIds[nextIndex];
    // t.commit();
    // await state.update(
    //     { lastStaffAssigned: nextStaffId },
    //     { transaction: t }
    // );
    return nextStaffId;
    // });
};

// const getNextRoundRobinStaffWithLocking = async (staffIds, merchantId) => {
//     if (!Array.isArray(staffIds) || staffIds.length === 0) {
//         throw new Error('Staff list is empty or invalid.');
//     }

//     // const transaction = options.transaction;

//     // Step 1 : Sort staff Ids
//     const sortedStaffIds = [...staffIds].sort((a, b) => a - b);

//     // Step 2 : Lock the row for update (to avoid race conditions)
//     let state = await StaffAssignmentState.findOne({
//         where: { merchantId },
//         attributes: ['id', 'lastStaffAssigned'],
//         lock: transaction.LOCK.UPDATE,  // use lock WITHIN parent transaction
//     });

//     // Step 3 : First-time setup if not found
//     if (!state) {
//         const firstStaffId = sortedStaffIds[0];

//         state = await StaffAssignmentState.create({
//             merchantId,
//             lastStaffAssigned: firstStaffId
//         }, { transaction });

//         return firstStaffId;
//     }

//     // Step 4 : Compute next staff in the rotation
//     const lastAssignedId = state.lastStaffAssigned;
//     const lastIndex = sortedStaffIds.indexOf(lastAssignedId);
//     const nextIndex = (lastIndex + 1) % sortedStaffIds.length;
//     const nextStaffId = sortedStaffIds[nextIndex];

//     return nextStaffId;
// };

function generateDisputeNotificationTemplate(disputeId, status, staffName, options) {
    switch (status) {
        case 'ASSIGNED':
            return {
                title: `New Dispute Assigned (#ID: ${disputeId})`,
                message: `Dispute #ID:${disputeId} has been assigned to You '${staffName}'. Please review and take appropriate action.`
            };
        case 'DISPUTE_RECEIVED_MERCHANT':
            return {
                title: `New Dispute Received (#ID: ${disputeId})`,
                message: `A new dispute has been raised and added to your feed. Your staff member '${staffName}' has been assigned to handle it. Please monitor for updates or required input.`
            };
        case 'DISPUTE_RECEIVED_UNASSIGNED':
            return {
                title: `New Dispute Received (#ID: ${disputeId})`,
                message: `A new dispute has been raised and added to your feed. Currently, no staff is available or assigned to handle this dispute. Please monitor for updates.`
            };

        case 'EVENT_CHANGED_ASSIGNED_STAFF':
            return {
                title: `Dispute Status Changed (#ID: ${disputeId}) and Assigned to Staff Member '${staffName}'`,
                message: `The event of Dispute #ID:${disputeId} has been updated to "${options?.newStatus || 'New One'}". Review the case for more details.`
            };
        case 'STATUS_CHANGED':
            return {
                title: `Dispute Status Changed (#ID: ${disputeId})`,
                message: `The status of Dispute #ID: ${disputeId} has been updated to "${options?.newStatus || 'New One'}". Review the case for more details.`
            };
        case 'EVENT_CHANGED':
            return {
                title: `Dispute Status Changed (#ID: ${disputeId})`,
                message: `The event of Dispute #ID:${disputeId} has been updated to "${options?.newStatus || 'New One'}". Review the case for more details.`
            };

        case 'DISPUTE_UPDATED':
            return {
                title: `Dispute Updated (#ID: ${disputeId})`,
                message: `Dispute #ID:${disputeId} has been updated by ${options?.updatedBy || 'a user'}. Please review the latest changes.`
            };

        case 'ATTACHMENT_ADDED':
            return {
                title: `New Attachment in Dispute (#ID: ${disputeId})`,
                message: `A new document or file has been added to Dispute #ID:${disputeId}. Please check the attachments section.`
            };

        case 'DETAILS_EDITED':
            return {
                title: `Dispute Details Edited (#ID: ${disputeId})`,
                message: `Some key information in Dispute #ID:${disputeId} has been edited. Kindly review the changes to stay updated.`
            };
        case 'ESCALATED':
            return {
                title: `Dispute Escalated (#ID: ${disputeId})`,
                message: `Dispute #ID:${disputeId} has been escalated for higher-level review. Please examine the case urgently.`
            };
        case 'RESOLVED':
            return {
                title: `Dispute Resolved (#ID: ${disputeId})`,
                message: `Dispute #ID:${disputeId} has been marked as resolved. No further action is required unless reopened.`
            };
        case 'REOPENED':
            return {
                title: `Dispute Reopened (#ID: ${disputeId})`,
                message: `Customer has reopened Dispute #ID:${disputeId}. Review the updated comments and respond as necessary.`
            };
        case 'COMMENTED':
            return {
                title: `New Comment on Dispute (#ID: ${disputeId})`,
                message: `A new comment was added to Dispute #ID:${disputeId}. Please review the comment and provide a response.`
            };
        default:
            return {
                title: `Dispute Update (#ID: ${disputeId})`,
                message: `There is a new update on Dispute #ID:${disputeId}. Please check the latest information in your dashboard.`
            };
    }
}



export {
    Gateway_Ip_Addresses,
    DetectPaymentGateway,
    OrchestratorGatewayParser,
    getNextRoundRobinStaffWithLocking,
    getNextRoundRobinStaffWithoutLocking,
    generateDisputeNotificationTemplate
}