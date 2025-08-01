import OTP from './otp.model.js';
import UserRole from './user-role.model.js';
import Merchant from './merchant.model.js';
import Business from './business.model.js';
import StaffBusinessMap from './staff-business-map.model.js';
import Analyst from './analyst.model.js';
import Manager from './manager.model.js';
import Dispute from './dispute.model.js';
import DisputeLog from './dispute-log.model.js';
import DisputeHistory from './dispute-history.model.js';
import StaffAssignmentState from './staff-assign-state.model.js';
import Payload from './payload.model.js';
import Notification from './notification.model.js';
import Attachment from './attachment.model.js';
import RejectFeedback from './reject-feedback.model.js';

export default function initModels(sequelize, DataTypes) {
    const db = {
        sequelize,
        OTP: OTP(sequelize, DataTypes),
        UserRole: UserRole(sequelize, DataTypes),
        Merchant: Merchant(sequelize, DataTypes),
        Business: Business(sequelize, DataTypes),
        StaffBusinessMap: StaffBusinessMap(sequelize, DataTypes),
        Analyst: Analyst(sequelize, DataTypes),
        Manager: Manager(sequelize, DataTypes),
        Dispute: Dispute(sequelize, DataTypes),
        DisputeLog: DisputeLog(sequelize, DataTypes),
        DisputeHistory: DisputeHistory(sequelize, DataTypes),
        StaffAssignmentState: StaffAssignmentState(sequelize, DataTypes),
        Payload: Payload(sequelize, DataTypes),
        Notification: Notification(sequelize, DataTypes),
        Attachment: Attachment(sequelize, DataTypes),
        RejectFeedback: RejectFeedback(sequelize, DataTypes),
    };

    // Apply associations
    Object.values(db).forEach((model) => {
        if (model?.associate) {
            model.associate(db);
        }
    });

    return db;
}
