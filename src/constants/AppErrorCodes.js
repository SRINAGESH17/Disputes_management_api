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
    validFieldObjectIdIsRequired: (field) => (`Valid ${field} as ObjectId is required.`),
    fieldMustBeaValidObjectId: (field) => (`${field} Must Be A Valid ObjectId`)
}

export default AppErrorCode;