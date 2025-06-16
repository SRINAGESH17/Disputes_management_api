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