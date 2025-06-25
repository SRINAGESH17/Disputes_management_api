

/**
 * Staff Model
 * 
 * Represents a staff member in the system.
 * 
 * @augments Model
 * 
 * @property {number} id - Primary key, auto-incremented.
 * @property {string} staffId - Unique staff identifier (10-30 chars).
 * @property {string} firebaseId - Firebase UID for authentication.
 * @property {number} merchantId - Foreign key referencing Merchant.
 * @property {string} email - Staff email address (unique, valid email).
 * @property {string} firstName - Staff first name.
 * @property {string} lastName - Staff last name.
 * @property {string} mobileNumber - Staff mobile number (unique).
 * @property {string} staffRole - Staff role (default: "staff").
 * @property {number} userRole - Foreign key referencing UserRole.
 * @property {string} status - Staff status (default: "ACTIVE").
 * @property {Date} createdAt - Timestamp of creation.
 * @property {Date} updatedAt - Timestamp of last update.
 * 
 * @see {@link ../config/database.js}
 * 
 * @class
 * 
 * @example
 * // Creating a new staff member
 * const staff = await Staff.create({
 *   staffId: 'STAFF123456',
 *   firebaseId: 'firebase-uid',
 *   merchantId: 1,
 *   email: 'staff@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   mobileNumber: '1234567890',
 *   staffRole: 'manager',
 *   userRole: 2,
 *   status: 'ACTIVE'
 * });
 * 
 * @static
 * @function associate
 * @param {object} models - All models for association.
 * @description
 * Defines associations:
 * - Staff belongs to UserRole (as 'role')
 * - Staff belongs to Merchant (as 'merchant')
 * - Staff has many Disputes (as 'disputes')
 * 
 * @schema
 * {
 *   id: INTEGER, PRIMARY KEY, AUTO_INCREMENT
 *   staffId: STRING(10-30), NOT NULL, UNIQUE
 *   firebaseId: STRING, NOT NULL, UNIQUE
 *   merchantId: INTEGER, NOT NULL, FOREIGN KEY (merchants.id)
 *   email: STRING, NOT NULL, UNIQUE, isEmail
 *   firstName: STRING, NOT NULL
 *   lastName: STRING, NOT NULL
 *   mobileNumber: STRING, NOT NULL, UNIQUE
 *   staffRole: STRING, DEFAULT "staff"
 *   userRole: INTEGER, FOREIGN KEY (user_roles.id)
 *   status: STRING, DEFAULT "ACTIVE"
 *   createdAt: DATE
 *   updatedAt: DATE
 * }
 * 
 * @indexes
 * - merchant_id
 * - mobile_number (unique)
 * - staff_id (unique)
 * - firebase_id (unique)
 * - email (unique)
 * - created_at
 * - first_name, last_name
 */
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
        staffRole: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "staff"
        },
        // disputeLimit: {
        //     type: DataTypes.INTEGER,
        //     defaultValue: 10,
        // },
        // totalDisputes: {
        //     type: DataTypes.INTEGER,
        //     defaultValue: 0,
        // },
        // disputesPending: {
        //     type: DataTypes.INTEGER,
        //     defaultValue: 0,
        // },
        // disputesClosed: {
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
            unique: true,
            name: 'unique_staff_mobile',
            fields: ["mobile_number"],
        },
        {
            unique: true,
            name: 'unique_staff_id',
            fields: ["staff_id"],
        },
        {
            unique: true,
            name: 'unique_staff_firebase',
            fields: ["firebase_id"],
        },
        {
            unique: true,
            name: 'unique_staff_email',
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