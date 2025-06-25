import sequelize from "../config/database.js";
import env from "../constants/env.js";
import Dispute from "./Dispute.model.js";
import DisputeHistory from "./DisputeHistory.model.js";
import DisputeLog from "./DisputeLog.model.js";
import Merchant from "./Merchant.model.js";
import Staff from "./Staff.model.js";
import UserRole from "./UserRole.model.js";
import OTP from "./Otp.model.js";
import StaffAssignmentState from "./StaffAssignState.model.js";
import Payload from "./Payload.model.js";
import Notification from "./Notification.model.js";



const db = {
    sequelize,
    Merchant,
    Dispute,
    DisputeLog,
    DisputeHistory,
    UserRole,
    Staff,
    OTP,
    StaffAssignmentState,
    Payload,
    Notification
};

Object.values(db).forEach(model => {
    // console.log(`Model: ${model.name}, Table: ${model.tableName}`);
    if (model?.associate) {
        model.associate(db);
    }
});

// Connect to database
export const initializeDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`✅ ${env.NODE_ENV} DB connected successfully.`);
        // Sync all models
        console.log(`${env.NODE_ENV} : ${env.DEV_DB_URL}`);
    } catch (error) {
        console.error('DB initialization failed:', error);
        throw error;
    }
};