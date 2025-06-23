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