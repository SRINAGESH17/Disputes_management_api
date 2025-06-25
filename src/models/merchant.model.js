/**
 * Merchant Model
 * 
 * Represents a merchant entity in the system.
 * 
 * @extends Model
 * 
 * @typedef {Object} Merchant
 * @property {number} id - Primary key, auto-incremented.
 * @property {string} [merchantId] - Unique merchant identifier (10-30 chars).
 * @property {string} email - Merchant's email address (unique, required).
 * @property {string} name - Merchant's name (required, 3-50 chars).
 * @property {string} mobileNumber - Merchant's mobile number (unique, required, validated format).
 * @property {string} firebaseId - Firebase user ID (unique, required, 3-50 chars).
 * @property {string} [gstin] - GSTIN number (optional, 15 chars, validated format).
 * @property {string[]} [gateways] - Array of payment gateway names (optional).
 * @property {number} totalStaff - Total number of staff (default: 0).
 * @property {number} totalDisputes - Total number of disputes (default: 0).
 * @property {number} disputesClosed - Number of closed disputes (default: 0).
 * @property {number} activeDisputes - Number of active disputes (default: 0).
 * @property {number} [userRole] - Foreign key referencing UserRole.
 * @property {Date} createdAt - Timestamp of creation.
 * @property {Date} updatedAt - Timestamp of last update.
 * 
 * @class
 * @property {function} associate - Defines model associations.
 * 
 * @see {@link ../config/database.js}
 * 
 * @schema
 * Table name: merchants
 * Columns:
 *   - id: INTEGER, PRIMARY KEY, AUTO_INCREMENT
 *   - merchant_id: STRING, UNIQUE, NULLABLE, 10-30 chars
 *   - email: STRING, UNIQUE, NOT NULL
 *   - name: STRING, NOT NULL, 3-50 chars
 *   - mobile_number: STRING, UNIQUE, NOT NULL, validated format
 *   - firebase_id: STRING, UNIQUE, NOT NULL, 3-50 chars
 *   - gstin: STRING, NULLABLE, 15 chars, validated format
 *   - gateways: ARRAY of STRING, NULLABLE, default []
 *   - total_staff: INTEGER, default 0
 *   - total_disputes: INTEGER, default 0
 *   - disputes_closed: INTEGER, default 0
 *   - active_disputes: INTEGER, default 0
 *   - user_role: INTEGER, FK to user_roles(id), NULLABLE
 *   - created_at: DATE
 *   - updated_at: DATE
 * Indexes:
 *   - created_at
 *   - merchant_id (unique)
 *   - email (unique)
 *   - mobile_number (unique)
 *   - firebase_id (unique)
 * 
 * Associations:
 *   - belongsTo UserRole (as: role)
 *   - hasMany Dispute (as: disputes)
 *   - hasMany DisputeHistory (as: disputeHistories)
 *   - hasMany Staff (as: staffs)
 *   - hasMany DisputeLog (as: disputeLogs)
 */
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