import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Payload extends Model {
    static associate(models) {
        Payload.hasOne(models.DisputeHistory, { foreignKey: 'payloadId', as: 'disputeHistory' });

        Payload.hasOne(models.DisputeLog, { foreignKey: 'payloadId', as: 'disputeLog' });
    }

}

Payload.init({
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
    payloadType: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'webhook',
        validate: {
            isIn: {
                args: [['webhook', 'gstin']]
            },
        }
    },
    rawPayload: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'rowPayload cannot be empty' },
        }
    },
}, {
    sequelize,
    modelName: 'Payload',
    tableName: 'payloads',
    timestamps: true,
    indexes: [
        {
            fields: ['merchant_id']
        },
    ]
});


export default Payload;