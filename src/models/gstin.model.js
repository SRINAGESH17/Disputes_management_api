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
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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


export default GSTIN;