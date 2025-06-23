import yup from "yup";

const emailValidate = yup.string()
    .email('Invalid email format')
    .required('Email is required');

const mobileNumberValidate = yup.string()
    .required("mobileNumber is required")
    .matches(/^\+91[6-9]\d{9}$/, "Enter a valid mobileNumber.");


const dobValidate = yup.date()
    .required("dob is required")
    .max(new Date(new Date().setFullYear(new Date().getFullYear() - 18)), "You must be at least 18 years old.").typeError("Invalid date format");


// *********** Merchant Register Schema *******************

const passwordValidate = yup.string()
    .required("password is required")
    .min(8, "password must contain minimum 8 characters")
    .matches(/[a-z]/, "password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "password must contain at least one uppercase letter")
    .matches(/\d/, "password must contain at least one number")
    .matches(/[@$!%*?&#^()_\-+=]/, "password must contain at least one special character");

const merchantRegisterSchema = yup.object({
    name: yup.string().required("name is required").min(3, 'name must contain minimum 3 characters.'),
    email: emailValidate,
    mobileNumber: mobileNumberValidate,
    password: passwordValidate,
});

const addingStaffSchema = yup.object({
    firstName: yup.string().required('firstName is required').min(2, 'First Name must contain minimum 1 or 2 characters'),
    lastName: yup.string().required('lastName is required').min(2, 'Last Name must contain minimum 1 or 2 characters'),
    role: yup.string().required('role is required'),
    email: emailValidate,
    mobileNumber: mobileNumberValidate,
    password: passwordValidate,
});



const normalizePayloadSchema = yup.object({
    disputeId: yup.string().required('disputeId is required'),
    paymentId: yup.string().required('paymentId is required'),
    gateway: yup.string().required('gateway is required'),
    // ipAddress: yup.string().required('ipAddress is required').matches(
    //     /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/,
    //     'Enter a valid IP address'
    // ),
    ipAddress: yup.string().required('ipAddress is required'),
    amount: yup.number().required('amount is required').min(0, 'amount must be positive'),
    currency: yup.string().required('currency is required'),
    reasonCode: yup.string().required('reasonCode is required'),
    reason: yup.string().required('reason is required'),
    disputeStatus: yup.string().required('disputeStatus is required'),
    event: yup.string().required('event is required'),
    statusUpdatedAt: yup.date().required('statusUpdatedAt is required').typeError('Invalid date format'),
    dueDate: yup.date().required('dueDate is required').typeError('Invalid date format'),
    type: yup.string().required('type is required'),
    status: yup.string().required('status is required'),
});

const msgPayloadSchema = yup.object({
    merchantId: yup.string()
        .required('merchantId is required')
        .matches(/^MID/, 'merchantId must start with MID'),
    GatewayIP: yup.string().required('GatewayIP is required'),
    headers: yup.mixed().required('headers are required'),
    rawPayload: yup.mixed().required('rawPayload is required')
});


export {
    emailValidate,
    mobileNumberValidate,
    dobValidate,
    merchantRegisterSchema,
    addingStaffSchema,
    normalizePayloadSchema,
    msgPayloadSchema
}