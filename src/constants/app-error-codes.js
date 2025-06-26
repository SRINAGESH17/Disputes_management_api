
/**
 * @namespace AppErrorCode
 * @description
 * Contains standard application error codes and utility functions for generating dynamic error messages.
 *
 * @property {string} InvalidAccessToken - Error code for invalid access token.
 * @property {string} MissingAuthToken - Error code for missing authentication token.
 * @property {string} EmailNotRegistered - Error code for unregistered email.
 * @property {string} InvalidPassword - Error code for invalid password.
 * @property {string} EmailAlreadyRegistered - Error code for already registered email.
 * @property {string} UserAlreadyExist - Error code for already existing user.
 * @property {string} InvalidEmailFormat - Error code for invalid email format.
 * @property {string} userRoleNotFound - Error code for user role not found.
 * @property {string} YouAreNotAuthorized - Error code for unauthorized access.
 *
 * @function fieldAlreadyRegistered
 * @param {string} field - The name of the field.
 * @returns {string} Error message indicating the field is already registered.
 *
 * @function validFieldIsRequired
 * @param {string} field - The name of the field.
 * @returns {string} Error message indicating a valid field is required.
 *
 * @function InvalidFieldFormat
 * @param {string} field - The name of the field.
 * @returns {string} Error message indicating the field has an invalid format.
 *
 * @function notAbleToCreateField
 * @param {string} field - The name of the field.
 * @returns {string} Error message indicating the field could not be created.
 *
 * @function fieldNotFound
 * @param {string} field - The name of the field.
 * @returns {string} Error message indicating the field was not found.
 *
 * @function fieldNotExist
 * @param {string} field - The name of the field.
 * @returns {string} Error message indicating the field does not exist.
 *
 * @function fieldIsRequired
 * @param {string} field - The name of the field.
 * @returns {string} Error message indicating the field is required.
 *
 */
const AppErrorCode = {
    // Auth App Errors Codes
    InvalidAccessToken: "InvalidAccessToken",
    MissingAuthToken: "Missing Auth Token.",
    EmailNotRegistered: "Email Not Registered.",
    InvalidPassword: "Invalid Password.",
    EmailAlreadyRegistered: "Email Already Registered.",
    UserAlreadyExist: "User Already Exist.",
    InvalidEmailFormat: "Invalid Email Format.",
    userRoleNotFound: "User Role Not Found.",
    YouAreNotAuthorized: "You Are Not Authorized.",


    fieldAlreadyRegistered : (field) => (`${field} Already Registered!`),
    validFieldIsRequired: (field) => (`Valid ${field} is required.`),
    InvalidFieldFormat: (field) => (`Invalid ${field} Format.`),
    notAbleToCreateField: (field) => (`Not Able to Create ${field}.`),
    fieldNotFound: (field) => (`${field} Not Found.`),
    fieldNotExist: (field) => (`${field} Not Exist.`),
    fieldIsRequired: (field) => (`${field} is required.`),
}

export default AppErrorCode;