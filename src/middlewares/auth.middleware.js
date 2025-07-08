/**
 * Extracts the Bearer token from the Authorization header and attaches it to the request object.
 *
 * @function getAuthToken
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */

/**
 * Middleware to authenticate requests by verifying the Firebase ID token from headers.
 *
 * @function auth
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {void}
 */

/**
 * Middleware to retrieve the user's role or permissions from the database using Firebase UID.
 *
 * @function getUserRole
 * @param {import('express').Request} req - Express request object (expects req.currUser.uid).
 * @param {import('express').Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>}
 */

/**
 * Middleware to verify if the authenticated user is a merchant.
 * Calls `auth` and `getUserRole` middlewares internally.
 *
 * @function verifyMerchant
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {void}
 */

import _ from "lodash";
import { failed_response } from "../utils/response.util.js";
import statusCodes from "../constants/status-codes.constant.js"
import AppErrorCodes from "../constants/app-error-codes.constant.js"
import { FirebaseVerifyIdToken } from "../firebase/firebase-utils.js";
import userRoleModel from '../models/user-role.model.js';

// GET AUTH TOKEN FROM HEADERS
const getAuthToken = (req, res, next) => {

    if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
        req.authToken = req.headers.authorization.split(" ")[1];
    } else {
        req.authToken = null;
    }

    next();
}


// AUTH : Verify Auth Token From Headers
const auth = (req, res, next) => {
    getAuthToken(req, res, async () => {
        try {
            const { authToken } = req;

            if (_.isEmpty(authToken)) {
                return res.status(statusCodes.NOT_FOUND).json(
                    failed_response(
                        statusCodes.NOT_FOUND,
                        "Token is missing from the headers",
                        { message: "Token is Missing" },
                        false
                    )
                );
            }

            console.time("Verify Firebase");
            const userInfo = await FirebaseVerifyIdToken(authToken);
            // console.log("userInfo : ", userInfo);
            req.currUser = userInfo;

            console.timeEnd("Verify Firebase");
            next();
        } catch (error) {
            return res.status(statusCodes.UNAUTHORIZED).json(
                failed_response(
                    statusCodes.UNAUTHORIZED,
                    error.message || 'User UnAuthorized',
                    { message: error },
                    false
                )
            );
        }
    });
};


// To Get User Role or Permissions
const getUserRole = async (req, res, next) => {
    const fireBaseId = req.currUser.uid;
    // console.log("firebaseId : ", fireBaseId);

    if (_.isEmpty(fireBaseId)) {
        return res.status(statusCodes.NOT_FOUND).json(
            failed_response(
                statusCodes.NOT_FOUND,
                AppErrorCodes.fieldNotFound('User'),
                { message: AppErrorCodes.fieldNotFound('User') },
                false
            )
        );
    }

    try {
        console.time("Find Role!")
        // Find The User Role
        const Role = await userRoleModel.findOne({ where: { firebaseId: fireBaseId }, raw: true });
        // console.log("User Role : ", Role)
        if (_.isEmpty(Role)) {
            return res.status(statusCodes.NOT_FOUND).json(
                failed_response(
                    statusCodes.NOT_FOUND,
                    AppErrorCodes.fieldNotFound('User Role'),
                    { message: AppErrorCodes.fieldNotFound('User Role') },
                    false
                )
            );
        }

        req.userRole = Role;
        req.currUser["userId"] = Role.userId;
        console.timeEnd("Find Role!");
        next();
    } catch (error) {
        return res.status(statusCodes.BAD_REQUEST).json(
            failed_response(
                statusCodes.BAD_REQUEST,
                AppErrorCodes.fieldNotFound('User Role'),
                { message: error },
                false
            )
        );
    }
};


// To Verify the Merchant
const verifyMerchant = (req, res, next) => {
    auth(req, res, async () => {
        getUserRole(req, res, async () => {

            if (req?.userRole?.merchant) {
                req.authId = req.currUser.uid;
                console.log("Verified Merchant")
                next();
            } else {
                // return res.status(403).json(failed_response(403, "you are not authorized User", {}, false));
                return res.status(statusCodes.FORBIDDEN).json(
                    failed_response(
                        statusCodes.FORBIDDEN,
                        'You are not authorized to access this resource',
                        { message: 'Unauthorized user' },
                        false
                    )
                );
            }
        });
    });
};

export {
    auth,
    getUserRole,
    verifyMerchant
}