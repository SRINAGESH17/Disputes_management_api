

/**
 * GSTIN Model
 *
 * Represents the GSTIN (Goods and Services Tax Identification Number) entity.
 *
 * @typedef {Object} GSTIN
 * @property {number} id - Primary key, auto-incremented.
 * @property {number} merchantId - Foreign key referencing the merchant.
 * @property {string} verificationValue - Value used for GSTIN verification.
 * @property {string} otpReference - Reference for the OTP sent for verification.
 * @property {number} otpNumber - OTP number sent for verification.
 * @property {Date} expiresIn - Expiry date and time for the OTP.
 * @property {boolean} isVerified - Indicates if the GSTIN has been verified.
 *
 * @schema
 * {
 *   "id": "integer (auto-increment, primary key)",
 *   "merchantId": "integer (required, references merchants.id)",
 *   "verificationValue": "string (required)",
 *   "otpReference": "string (required)",
 *   "otpNumber": "integer (required)",
 *   "expiresIn": "date (required)",
 *   "isVerified": "boolean (default: false)"
 * }
 *
 * @example
 * {
 *   id: 1,
 *   merchantId: 101,
 *   verificationValue: "ABC123XYZ",
 *   otpReference: "REF987654",
 *   otpNumber: 123456,
 *   expiresIn: "2024-06-30T12:00:00Z",
 *   isVerified: false
 * }
 */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class GSTIN extends Model {
    // static associate(models) {}

}

GSTIN.init({
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
    modelName: 'GSTIN',
    tableName: 'gstins',
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

export default GSTIN;