
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config.js';

class Analyst extends Model {
    static associate(models) {

        // Analyst Has Many Notifications
        Analyst.hasMany(models.Notification, {
            foreignKey: 'recipientId',
            constraints: false,
            scope: {
                recipient_type: 'ANALYST' // ← matches SQL column name
            },
            as: 'analystNotifications'
        });

        // Analyst Has Maps to Multiple Business Of Merchant
        Analyst.hasMany(models.Business, {
            foreignKey: 'staffId',
            constraints: false,
            scope: {
                staffRef: 'ANALYST' // ← matches SQL column name
            },
            as: 'AnalystMap'
        });

        // Analyst Has One Role
        Analyst.hasOne(models.UserRole, {
            foreignKey: 'userId',
            constraints: false,
            scope: {
                user_ref: 'ANALYST' // ← matches SQL column name
            },
            as: 'role'
        });

        // Analyst Belongs to Merchant
        Analyst.belongsTo(models.Merchant, {
            foreignKey: 'merchantId',
            as: 'merchant',
        });

        // Analyst Has Many Disputes
        Analyst.hasMany(models.Dispute, {
            foreignKey: 'analystId',
            as: 'disputes',
        });

    };
}

Analyst.init(
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
            defaultValue: "analyst"
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
            allowNull: true,
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
        approvedDisputes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        rejectedDisputes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        submittedDisputes: {
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
    modelName: 'Analyst',
    tableName: 'analysts',
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
            name: 'unique_analyst_mobile',
            fields: ["mobile_number"],
        },
        {
            unique: true,
            name: 'unique_analyst_staff_id',
            fields: ["staff_id"],
        },
        {
            unique: true,
            name: 'unique_analyst_firebase',
            fields: ["firebase_id"],
        },
        {
            unique: true,
            name: 'unique_analyst_email',
            fields: ["email"],
        },
        {
            fields: ["selected_business_Id"],
        },
    ]
});

export default Analyst;