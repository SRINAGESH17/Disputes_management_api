

/**
 * StaffAssignmentState Model
 * 
 * Represents the assignment state of staff to merchants.
 * 
 * @extends Model
 * 
 * @property {number} id - Primary key, auto-incremented.
 * @property {number} merchantId - Foreign key referencing Merchant (merchants.id).
 * @property {number} lastStaffAssigned - Foreign key referencing Staff (staff.id).
 * @property {Date} createdAt - Timestamp of creation.
 * @property {Date} updatedAt - Timestamp of last update.
 * 
 * @association
 * - belongsTo Merchant as 'merchant' via merchantId
 * - belongsTo Staff as 'lastStaff' via lastStaffAssigned
 * 
 * @schema
 * {
 *   id: INTEGER, PRIMARY KEY, AUTO_INCREMENT,
 *   merchantId: INTEGER, NOT NULL, REFERENCES merchants(id),
 *   lastStaffAssigned: INTEGER, NOT NULL, REFERENCES staff(id),
 *   createdAt: DATE,
 *   updatedAt: DATE
 * }
 * 
 * @table staff_assignment_states
 * @index merchant_id
 */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config.js';

class RejectFeedback extends Model {
    static associate(models) { }

}

RejectFeedback.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    businessId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'businesses',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    disputeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'disputes',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    userRejectedId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    userRejectedRef: {
        type: DataTypes.ENUM('MERCHANT', 'MANAGER'),
        allowNull: false,
    },
    rejectedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    feedback: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    comments: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    fileNames: {
        type: DataTypes.STRING,
        allowNull: false
    }

}, {
    sequelize,
    modelName: 'RejectFeedback',
    tableName: 'reject_feedbacks',
    timestamps: true,
    indexes: [
        {
            fields: ['dispute_id']
        }
    ]
});


export default RejectFeedback;