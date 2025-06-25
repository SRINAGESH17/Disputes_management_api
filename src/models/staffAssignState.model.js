
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
import sequelize from '../config/database.js';

class StaffAssignmentState extends Model {
    // static associate(models) {}
    static associate(models) {
        StaffAssignmentState.belongsTo(models.Merchant, {
            foreignKey: 'merchantId',
            as: 'merchant'
        });
        StaffAssignmentState.belongsTo(models.Staff, {
            foreignKey: 'lastStaffAssigned',
            as: 'lastStaff'
        });
    }

}

StaffAssignmentState.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    merchantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'merchants',
            key: 'id',
        },
    },
    lastStaffAssigned: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'staff',
            key: 'id',
        },
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


export default StaffAssignmentState;