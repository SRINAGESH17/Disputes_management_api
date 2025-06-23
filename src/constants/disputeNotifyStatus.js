// DisputeStatus constants represent the various states and events

// that a dispute can go through in the system.
const DisputeNotifyStatus = {
    // When a dispute is assigned to a staff member
    ASSIGNED: 'ASSIGNED',

    // Dispute received and assigned to a merchant
    DISPUTE_RECEIVED_MERCHANT: 'DISPUTE_RECEIVED_MERCHANT',

    // Dispute received but not yet assigned to Any Staff
    DISPUTE_RECEIVED_UNASSIGNED: 'DISPUTE_RECEIVED_UNASSIGNED',

    // Dispute Event is Changed And Assigned to Staff when it is not been Assigned
    EVENT_CHANGED_ASSIGNED_STAFF: 'EVENT_CHANGED_ASSIGNED_STAFF',

    // Status of the dispute has changed
    STATUS_CHANGED: 'STATUS_CHANGED',

    // Generic event change related to the dispute
    EVENT_CHANGED: 'EVENT_CHANGED',

    // Dispute details have been updated
    DISPUTE_UPDATED: 'DISPUTE_UPDATED',

    // An attachment has been added to the dispute
    ATTACHMENT_ADDED: 'ATTACHMENT_ADDED',

    // Dispute details have been edited
    DETAILS_EDITED: 'DETAILS_EDITED',

    // Dispute has been escalated to a higher authority
    ESCALATED: 'ESCALATED',

    // Dispute has been resolved
    RESOLVED: 'RESOLVED',

    // Dispute has been reopened after being resolved
    REOPENED: 'REOPENED',

    // A comment has been added to the dispute
    COMMENTED: 'COMMENTED'
};

export default DisputeNotifyStatus;