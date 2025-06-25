/**
 * An array of supported verification types.
 * @type {Array<'email' | 'mobile_number'>}
 */

/**
 * An object mapping verification types to their string identifiers.
 * @type {{ email: string, mobile_number: string }}
 */
const verificationTypes = ['email', 'mobile_number'];
const verificationCodes = {
    email: "email",
    mobile_number: "mobile_number"
}

export {
    verificationTypes,
    verificationCodes
}