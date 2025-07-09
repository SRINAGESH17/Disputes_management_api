/**
 * Enum representing the possible states of a dispute.
 * @readonly
 * @enum {string}
 * @property {string} CREATED - The dispute has been created but not yet initiated.
 * @property {string} INITIATED - The dispute process has been started.
 * @property {string} ACTIVE - The dispute is currently open and active.
 * @property {string} CLOSED - The dispute has been closed and is no longer active.
 * @property {string} ACTION_REQUIRED - Further action is required from one or more parties.
 * @property {string} UNDER_REVIEW - The dispute is currently being reviewed.
 * @property {string} REVIEWED - The dispute has been reviewed.
 * @property {string} RESOLVED - The dispute has been resolved.
 * @property {string} WON - The dispute was resolved in favor of the claimant.
 * @property {string} LOST - The dispute was resolved against the claimant.
 * @property {string} CANCELLED - The dispute has been cancelled and will not proceed.
 */
const disputeStates = {
    // The dispute has been created but not yet initiated.
    CREATED: 'CREATED',

    // The dispute process has been started.
    INITIATED: 'INITIATED',

    // The dispute is currently open and active.
    ACTIVE: 'ACTIVE',
    OPEN: 'OPEN',

    // The dispute has been closed and is no longer active.
    CLOSED: 'CLOSED',

    // Further action is required from one or more parties.
    ACTION_REQUIRED: 'ACTION_REQUIRED',

    // The dispute is currently being reviewed.
    UNDER_REVIEW: 'UNDER_REVIEW',

    // The dispute has been reviewed.
    REVIEWED: 'REVIEWED',
    // The dispute has been Accepted.
    ACCEPTED: 'ACCEPTED',

    // The dispute has been resolved.
    RESOLVED: 'RESOLVED',

    // The dispute was resolved in favor of the claimant.
    WON: 'WON',

    // The dispute was resolved against the claimant.
    LOST: 'LOST',

    // The dispute has been cancelled and will not proceed.
    CANCELLED: 'CANCELLED'
};

const disputeStatesArray = Object.values(disputeStates);

const getDisputeInternalState = (state) => {
    // Step 1 : Convert the state to Lowercase to ensure case-insensitive comparison
    const lowercaseState = state?.toLowerCase();

    // Step 2 : Check if the state is one of the dispute states or not
    const isValidState = disputeStatesArray.find((state) => state?.toLowerCase()?.includes(lowercaseState));
    const internalState = isValidState || disputeStates.INITIATED;

    // Step 3 : Return the internal state in a human-readable format
    return internalState?.split("_")?.map((s) => s[0]?.toUpperCase() + s.slice(1)?.toLowerCase())?.join(" ");
}

export { disputeStates, disputeStatesArray, getDisputeInternalState }
