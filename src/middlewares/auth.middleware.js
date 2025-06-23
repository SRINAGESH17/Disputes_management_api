import _ from "lodash";
import { failed_response } from "../utils/response.js";
import statusCodes from "../constants/httpStatusCodes.js"
import AppErrorCodes from "../constants/AppErrorCodes.js"
import { FirebaseVerifyIdToken } from "../firebase/firebaseUtils.js";
import userRoleModel from '../models/userRole.model.js';

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

            const userInfo = await FirebaseVerifyIdToken(authToken);
            // console.log("userInfo : ", userInfo);
            req.currUser = userInfo;

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