
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config.js';

class Manager extends Model {
    static associate(models) {
        // Manager Has Many Notifications
        Manager.hasMany(models.Notification, {
            foreignKey: 'recipientId',
            constraints: false,
            scope: {
                recipient_type: 'MANAGER' // ← matches SQL column name
            },
            as: 'managerNotification'
        });

        // Manager Has Maps to Multiple Business Of Merchant
        Manager.hasMany(models.Business, {
            foreignKey: 'staffId',
            constraints: false,
            scope: {
                staff_ref: 'MANAGER' // ← matches SQL column name
            },
            as: 'managerMap'
        });

        // Manager Has One Role
        Manager.hasOne(models.UserRole, {
            foreignKey: 'userId',
            constraints: false,
            scope: {
                user_ref: 'MANAGER' // ← matches SQL column name
            },
            as: 'role'
        });

        // Manager Belongs to Merchant
        Manager.belongsTo(models.Merchant, {
            foreignKey: 'merchantId',
            as: 'merchant',
        });

        // Manager Has Many Disputes
        Manager.hasMany(models.Dispute, {
            foreignKey: 'managerId',
            as: 'disputes',
        });
    };
}

Manager.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        staffId: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [10, 30],
            },
        },
        firebaseId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        mobileNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        staffRole: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "manager"
        },
        merchantId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'merchants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        selectedBusinessId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'staff_business_maps',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        userRole: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'user_roles',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        },
        totalDisputes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        acceptedDisputes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        rejectedDisputes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        resubmittedDisputes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        pendingDisputes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'ACTIVE'
        },
    }, {
    sequelize,
    modelName: 'Manager',
    tableName: 'managers',
    timestamps: true,
    indexes: [
        {
            fields: ["merchant_id"]
        },
        {
            fields: ["created_at"]
        },
        {
            fields: ["first_name", "last_name"]
        },
        {
            unique: true,
            name: 'unique_manager_mobile',
            fields: ["mobile_number"],
        },
        {
            unique: true,
            name: 'unique_manager_staff_id',
            fields: ["staff_id"],
        },
        {
            unique: true,
            name: 'unique_manager_firebase',
            fields: ["firebase_id"],
        },
        {
            unique: true,
            name: 'unique_manager_email',
            fields: ["email"],
        },
        {
            fields: ["selected_business_Id"],
        },
    ]
});

export default Manager;