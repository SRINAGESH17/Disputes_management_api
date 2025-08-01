
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

class StaffAssignmentState extends Model {
    // static associate(models) {}
    static associate(models) {

        // Staff Record Belongs to merchant
        StaffAssignmentState.belongsTo(models.Merchant, {
            foreignKey: 'merchantId',
            as: 'merchant'
        });

        // Staff Belongs to original Analyst
        StaffAssignmentState.belongsTo(models.Analyst, {
            foreignKey: 'lastStaffAssigned',
            as: 'AssignAnalyst'
        });
    }

}

StaffAssignmentState.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    merchantId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'merchants',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    lastStaffAssigned: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'analysts',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
}, {
    sequelize,
    modelName: 'StaffAssignmentState',
    tableName: 'staff_assignment_states',
    timestamps: true,
    indexes: [
        {
            fields: ['merchant_id']
        },
    ]
});


// Requirements

// fields
// 1. lastStaffAssigned -> optional , 
// DESC : when we assign to merchant then we can make this to null , so after merchant if null then other analyst will be assigned

export default StaffAssignmentState;