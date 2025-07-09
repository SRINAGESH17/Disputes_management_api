import sequelize from '../config/database.config.js';
import env from "../constants/env.constant.js";
import Dispute from "./dispute.model.js";
import DisputeHistory from "./dispute-history.model.js";
import DisputeLog from "./dispute-log.model.js";
import Merchant from "./merchant.model.js";
import Staff from "./staff.model.js";
import UserRole from "./user-role.model.js";
import OTP from "./otp.model.js";
import StaffAssignmentState from "./staff-assign-state.model.js";
import Payload from "./payload.model.js";
import Notification from "./notification.model.js";
import Analyst from './analyst.model.js';
import Manager from './manager.model.js';
import Business from './business.model.js';
import StaffBusinessMap from './staff-business-map.model.js';



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
    Notification,
    Analyst,
    Manager,
    Business,
    StaffBusinessMap
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