

import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config.js';

class StaffBusinessMap extends Model {
    // static associate(models) {}
    static associate(models) {

        // Staff Business Map Belongs to Merchant
        StaffBusinessMap.belongsTo(models.Merchant, {
            foreignKey: 'merchantId',
            as: 'merchant'
        });

        // Staff Business Map Belongs to Merchant Business
        StaffBusinessMap.belongsTo(models.Staff, {
            foreignKey: 'businessId',
            as: 'StaffMapBusiness'
        });
    }

}

StaffBusinessMap.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    staffId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    staffRef: {
        type: DataTypes.ENUM('ANALYST', 'MANAGER'),
        allowNull: false,
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
    firebaseId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'StaffBusinessMap',
    tableName: 'staff_business_maps',
    timestamps: true,
    indexes: [
        {
            fields: ['merchant_id']
        },
        {
            fields: ['business_Id']
        },
        {
            fields: ['staff_id', 'staff_ref']
        },
    ]
});


export default StaffBusinessMap;