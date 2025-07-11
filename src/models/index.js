import sequelize from '../config/database.config.js';
import env from "../constants/env.constant.js";
import Analyst from './analyst.model.js';
import Business from './business.model.js';
import Dispute from './dispute.model.js';
import Manager from './manager.model.js';
import Merchant from './merchant.model.js';
import OTP from './otp.model.js';
import StaffBusinessMap from './staff-business-map.model.js';
import UserRole from './user-role.model.js';
import DisputeLog from "./dispute-log.model.js";
import DisputeHistory from "./dispute-history.model.js";
import StaffAssignmentState from "./staff-assign-state.model.js";
import Payload from "./payload.model.js";
import Notification from "./notification.model.js";



const db = {
    sequelize,
    OTP,
    UserRole,
    Merchant,
    Business,
    StaffBusinessMap,
    Analyst,
    Manager,
    Dispute,
    DisputeLog,
    DisputeHistory,
    StaffAssignmentState,
    Payload,
    Notification,
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
        // console.log('🚨 ATTRIBUTES:', Object.keys(Business.rawAttributes));
        // console.log('🚨 TABLE ATTRIBUTES:', Object.keys(Business.tableAttributes));
    } catch (error) {
        console.error('DB initialization failed:', error);
        throw error;
    }
};