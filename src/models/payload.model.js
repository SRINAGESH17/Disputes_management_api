import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Payload extends Model {
    static associate(models) {
        Payload.hasMany(models.DisputeHistory, { foreignKey: 'payloadId', as: 'disputeHistory' });

        Payload.hasMany(models.DisputeLog, { foreignKey: 'payloadId', as: 'disputeLog' });
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
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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