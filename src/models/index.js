import sequelize from "../config/database.js";
import env from "../constants/env.js";
import Dispute from "./dispute.model.js";
import DisputeHistory from "./disputeHistory.model.js";
import DisputeLog from "./disputeLog.model.js";
import Merchant from "./merchant.model.js";
import Staff from "./staff.model.js";
import UserRole from "./userRole.model.js";
import OTP from "./otp.model.js";
import StaffAssignmentState from "./staffAssignState.model.js";
import Payload from "./payload.model.js";
import Notification from "./notification.model.js";



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