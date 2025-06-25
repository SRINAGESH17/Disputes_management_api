/**
 * DisputeNotifyStatus constants represent the various notification statuses 
 * and events that a dispute can go through in the system.
 *
 * @readonly
 * @enum {string}
 * @property {string} ASSIGNED - When a dispute is assigned to a staff member.
 * @property {string} DISPUTE_RECEIVED_MERCHANT - Dispute received and assigned to a merchant.
 * @property {string} DISPUTE_RECEIVED_UNASSIGNED - Dispute received but not yet assigned to any staff.
 * @property {string} EVENT_CHANGED_ASSIGNED_STAFF - Dispute event is changed and assigned to staff when it has not been assigned.
 * @property {string} STATUS_CHANGED - Status of the dispute has changed.
 * @property {string} EVENT_CHANGED - Generic event change related to the dispute.
 * @property {string} DISPUTE_UPDATED - Dispute details have been updated.
 * @property {string} ATTACHMENT_ADDED - An attachment has been added to the dispute.
 * @property {string} DETAILS_EDITED - Dispute details have been edited.
 * @property {string} ESCALATED - Dispute has been escalated to a higher authority.
 * @property {string} RESOLVED - Dispute has been resolved.
 * @property {string} REOPENED - Dispute has been reopened after being resolved.
 * @property {string} COMMENTED - A comment has been added to the dispute.
 */
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