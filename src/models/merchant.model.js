import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Merchant extends Model {
    static associate(models) {
        // Define associations
        Merchant.belongsTo(models.UserRole, { foreignKey: 'userRole', as: 'role' });

        Merchant.hasMany(models.Dispute, {
            foreignKey: "merchantId",
            constraints: true,
            onDelete: 'RESTRICT',
            as: {
                singular: "dispute",
                plural: "disputes"
            },
        });
        Merchant.hasMany(models.DisputeHistory, {
            foreignKey: "merchantId",
            onDelete: 'RESTRICT',
            as: {
                singular: "disputeHistory",
                plural: "disputeHistories"
            },
        });
        Merchant.hasMany(models.Staff, {
            foreignKey: "merchantId",
            onDelete: 'RESTRICT',
            as: {
                singular: "staff",
                plural: "staffs"
            },
        });
        Merchant.hasMany(models.DisputeLog, {
            foreignKey: "merchantId",
            onDelete: 'RESTRICT',
            as: {
                singular: "disputeLog",
                plural: "disputeLogs"
            },
        })
    };
}

Merchant.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    merchantId: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [10, 30],
        },
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Email is required" },
            isEmail: { msg: 'Invalid email format' },
        },
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "name is required" },
            len: [3, 50],
        },
    },
    mobileNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is(value) {
                if (value && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value)) {
                    throw new Error('Invalid mobile number format');
                }
            }
        }
    },
    firebaseId: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Firebase ID is required" },
            len: [3, 50],
        },
    },
    gstin: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            notEmpty(value) {
                if (value && value.trim() === '') {
                    throw new Error("GSTIN is required");
                }
            },
            len(value) {
                if (value && value.length !== 15) {
                    throw new Error("GSTIN must be 15 characters");
                }
            },
            is(value) {
                if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
                    throw new Error('Invalid GSTIN format');
                }
            },
            isValidGSTIN(value) {
                if (value) {
                    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
                    if (!regex.test(value)) {
                        throw new Error('Invalid GSTIN format');
                    }
                }
            }
        },
    },
    gateways: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
        validate: {
            isValidGateways(value) {
                if (!Array.isArray(value)) {
                    throw new Error('Gateways must be an array of strings');
                }
            }
        }
    },
    totalStaff: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    totalDisputes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    disputesClosed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    activeDisputes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    // disputesSubmitted: {
    //     type: DataTypes.INTEGER,
    //     defaultValue: 0,
    // },
    // disputesAssigned: {
    //     type: DataTypes.INTEGER,
    //     defaultValue: 0,
    // },
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

}, {
    sequelize,
    modelName: 'Merchant',
    tableName: 'merchants',
    timestamps: true,
    indexes: [
        {
            fields: ["created_at"]
        },
        {
            unique: true,
            name: 'unique_merchant_id',
            fields: ["merchant_id"]
        },
        {
            unique: true,
            name: 'unique_merchant_email',
            fields: ["email"]
        },
        {
            unique: true,
            name: 'unique_merchant_mobile',
            fields: ["mobile_number"]
        },
        {
            unique: true,
            name: 'unique_merchant_firebase',
            fields: ["firebase_id"]
        },
    ]
});

export default Merchant;