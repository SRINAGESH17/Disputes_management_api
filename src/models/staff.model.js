import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Staff extends Model {
    static associate(models) {
        // Define associations
        // Staff.hasOne(models.UserRole, {
        //     foreignKey: 'userId',
        //     as: 'staffRole',
        //     constraints: true,
        // });
        Staff.belongsTo(models.UserRole, { foreignKey: 'userRole', as: 'role' });

        Staff.belongsTo(models.Merchant, {
            foreignKey: 'merchantId',
            as: 'merchant',
        });
        Staff.hasMany(models.Dispute, {
            foreignKey: 'staffId',
            as: {
                singular: "dispute",
                plural: "disputes"
            },
        });
    };
}

Staff.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
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
        merchantId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'merchants',
                key: 'id',
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        mobileNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        designation: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ""
        },
        disputeLimit: {
            type: DataTypes.INTEGER,
            defaultValue: 10,
        },
        totalDisputes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        disputesPending: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        disputesClosed: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        userRole: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'user_roles',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'ACTIVE'
        },
    }, {
    sequelize,
    modelName: 'Staff',
    tableName: 'staff',
    timestamps: true,
    indexes: [
        {
            fields: ["merchant_id"]
        },
        {
            fields: ["mobile_number"],
        },
        {
            fields: ["staff_id"],
        },
        {
            fields: ["firebase_id"],
        },
        {
            fields: ["email"],
        },
        {
            fields: ["created_at"]
        },
        {
            fields: ["first_name", "last_name"]
        }
    ]
});

export default Staff;