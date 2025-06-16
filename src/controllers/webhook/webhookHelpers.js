import StaffAssignmentState from "../../models/staffAssignState.model.js";
import sequelize from '../../config/database.js';



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
    if (headers['x-cashfree-signature']) return 'cashfree';

    return null;
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

    const dispute = {
        event: disEvent,                                         // [ 'created', 'won', 'lost', 'closed', 'under_review', 'action_required' ]
        disputeId: disputeData?.entity?.id,                      // Ex: disp_EsIAlDcoUr8CaQ
        paymentId: disputeData?.entity?.payment_id,              // Ex: pay_EFtmUsbwpXwBHI
        amount: disputeData?.entity?.amount,                     // Ex: 39000
        currency: disputeData?.entity?.currency,                 // Ex : INR
        // paymentMode: paymentData?.entity?.method || null,        // Ex : card  
        statusUpdatedAt: updatedDate,                            // Ex : 1589907957 (Unix Timestamp) --> seconds (1589907957)  * milliseconds ( 1000 ) = new Date( seconds * milliseconds )  
        dueDate: respondBy,                                      // Ex : 1589907957 (Unix Timestamp) --> seconds (1589907957)  * milliseconds ( 1000 ) = new Date( seconds * milliseconds )  
        reasonCode: reason_code,                                 // EX : goods_or_services_not_received_or_partially_received
        reasonDescription: reasonDesc,                           // Ex : Goods Or Services Not Received Or Partially Received
        status: disputeData?.entity?.status,                     // Ex : open, won, lost, closed, under_review
        type: disputeData?.entity?.phase || 'chargeback'        // Ex :  chargeback, fraud
    }
    return dispute;

}
const CashfreeDisputeParser = (payload) => {

    // @desc : Parse the razorpay payload and pull important fields

    const disEvent = payload?.type?.split('_')?.reverse()?.[0]?.toLowerCase();
    const disputeData = payload?.data?.dispute || {};
    const orderData = payload?.data?.order_details || {};

    const updatedDate = new Date(payload?.event_time);
    const respondBy = new Date(payload?.data?.dispute?.respond_by);

    const dispute = {
        event: disEvent,                                                // [ 'created', 'updated', 'closed']
        disputeId: disputeData?.dispute_id,                             // Ex: 433475258
        paymentId: orderData?.cf_payment_id?.toString(),                // Ex: 885473311
        amount: disputeData?.dispute_amount,                            // Ex: 39000
        currency: disputeData?.dispute_amount_currency,                 // Ex : INR                                             // Ex : card --> no paymentMode field 
        statusUpdatedAt: updatedDate,                                   // Ex :  "2023-06-15T21:50:04+05:30"
        dueDate: respondBy,                                             // Ex : "2023-06-18T23:59:59+05:30"
        reasonCode: disputeData?.reason_code,                           // EX : "1402"
        reasonDescription: disputeData?.reason_description,             // Ex : Duplicate Processing
        status: disputeData?.dispute_status,                            // Ex : CHARGEBACK_MERCHANT_WON, PRE_ARBITRATION_CREATED,DISPUTE_CREATED
        type: disputeData?.dispute_type?.toLowerCase() || 'chargeback'  // Ex : DISPUTE, CHARGEBACK, PRE_ARBITRATION, ARBITRATION, RETRIEVAL
    }
    return dispute;
}

function OrchestratorGatewayParser(gateway, rawPayload) {
    console.log("gateway in parser : ", gateway);
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



export {
    Gateway_Ip_Addresses,
    DetectPaymentGateway,
    OrchestratorGatewayParser,
    getNextRoundRobinStaffWithLocking,
    getNextRoundRobinStaffWithoutLocking

}