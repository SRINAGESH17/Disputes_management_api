

/**
 * OTP Model - Represents a One-Time Password (OTP) entity for verification processes.
 *
 * @typedef {Object} OTP
 * @property {number} id - Unique identifier for the OTP record (Primary Key, Auto Increment).
 * @property {('email'|'phone'|...)} verificationKey - Type of verification (ENUM, values from verificationTypes).
 * @property {string} verificationValue - Value to be verified (e.g., email address or phone number).
 * @property {string} otpReference - Reference string for the OTP, used for tracking.
 * @property {number} otpNumber - The actual OTP number/code sent to the user.
 * @property {Date} expiresIn - Expiry date and time for the OTP.
 * @property {boolean} isVerified - Indicates if the OTP has been verified (default: false).
 * @property {Date} createdAt - Timestamp when the OTP record was created.
 * @property {Date} updatedAt - Timestamp when the OTP record was last updated.
 *
 * @class OTP
 * @extends Model
 *
 * @schema
 * {
 *   id: INTEGER, PRIMARY KEY, AUTO_INCREMENT,
 *   verificationKey: ENUM(...verificationTypes), NOT NULL,
 *   verificationValue: STRING, NOT NULL,
 *   otpReference: STRING, NOT NULL,
 *   otpNumber: INTEGER, NOT NULL,
 *   expiresIn: DATE, NOT NULL,
 *   isVerified: BOOLEAN, DEFAULT false,
 *   createdAt: DATE,
 *   updatedAt: DATE
 * }
 */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { verificationTypes } from "../constants/verificationCode.js"

class OTP extends Model {
    // static associate(models) {}

}

OTP.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    verificationKey: {
        type: DataTypes.ENUM(...verificationTypes),
        allowNull: false,
    },
    verificationValue: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    otpReference: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    otpNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    expiresIn: {
        type: DataTypes.DATE,
        allowNull: false
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'OTP',
    tableName: 'otp',
    timestamps: true,
    indexes: [
        {
            fields: ['verification_value']
        },
        {
            fields: ['otp_reference', 'otp_number']
        },
    ]
});


export default OTP;