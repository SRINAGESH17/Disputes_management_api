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