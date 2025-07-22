import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config.js';

class Business extends Model {
    // static associate(models) {}
    static associate(models) {
        // Each Business Belongs to Merchant
        Business.belongsTo(models.Merchant, {
            foreignKey: 'merchantId',
            as: 'merchant'
        });

        // Business Has Multiple Staff ( Analyst , Manager ) Business Maps
        Business.hasMany(models.StaffBusinessMap, {
            foreignKey: 'businessId',
            constraints: false,
            scope: {
                staff_ref: 'ANALYST' // ← matches SQL column name
            },
            as: 'AnalystBusinessMap'
        });

        // Manager Maps
        Business.hasMany(models.StaffBusinessMap, {
            foreignKey: 'businessId',
            constraints: false,
            scope: {
                staff_ref: 'MANAGER' // ← matches SQL column name
            },
            as: 'ManagerBusinessMap'
        });

        // Business Has Many Disputes
        Business.hasMany(models.Dispute, {
            foreignKey: 'businessId',
            as: "businessDisputes"
        });

        // Business Has Many Notifications
        Business.hasMany(models.Notification, {
            foreignKey: 'businessId',
            as: "businessNotifications"
        });

        // Business Has Many Logs
        Business.hasMany(models.DisputeLog, {
            foreignKey: 'businessId',
            as: "businessLogs"
        });

        // Business Has Many Attachments
        Business.hasMany(models.Attachment, {
            foreignKey: 'businessId',
            as: "businessAttachments"
        });

    }

}

Business.init({
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
    firebaseId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    customBusinessId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    gstin: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    gateways: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },
    businessName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Business',
    tableName: 'businesses',
    timestamps: true,
    indexes: [
        {
            fields: ['firebase_id']
        },
        {
            fields: ['merchant_id']
        },
        {
            unique: true,
            name: 'unique_business_account',
            fields: ['custom_business_id'],
        },
    ]
});
Business.beforeCreate((instance, options) => {
    console.log('🚨 Debug: inside Business.beforeCreate');
    console.log('Instance:', JSON.stringify(instance.toJSON(), null, 2));
    console.log('Options:', JSON.stringify(options, null, 2));
});
/*

Authorized Signatory : body.result.authorized_signatory as string[]
Name Of the Business Owner
Legal Business Name : body.result.legal_name as string
Business Nature : body.result.primary_business_address.business_nature as string
Business Email : body.result.business_email as string
Business Mobile : body.result.business_mobile as string
Public or Private Limited : body.result.business_constitution as string | 'Private Limited Company'
Primary Business Address: body.result.primary_business_address.registered_address
currentRegistrationStatus : body.result.current_registration_status as string | 'Active

*/
// Note : 
// Add index to gstin

export default Business;