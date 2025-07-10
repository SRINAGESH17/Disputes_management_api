
/**
 * Payload Model
 * 
 * Represents a payload entity associated with a merchant, which can be of type 'webhook' or 'gstin'.
 * Stores the raw payload data and maintains associations with DisputeHistory and DisputeLog.
 * 
 * @extends Model
 * 
 * @typedef {Object} Payload
 * @property {number} id - Primary key, auto-incremented.
 * @property {number} merchantId - Foreign key referencing the merchant.
 * @property {number} businessId - Foreign key referencing the business.
 * @property {'webhook'|'gstin'} payloadType - Type of the payload. Default is 'webhook'.
 * @property {string} rawPayload - The raw payload data (cannot be empty).
 * @property {Date} createdAt - Timestamp of creation.
 * @property {Date} updatedAt - Timestamp of last update.
 * 
 * @association
 * - hasOne DisputeHistory (as 'disputeHistory', foreignKey: 'payloadId')
 * - hasOne DisputeLog (as 'disputeLog', foreignKey: 'payloadId')
 * 
 * @schema
 * {
 *   id: INTEGER, PRIMARY KEY, AUTO_INCREMENT
 *   merchantId: INTEGER, NOT NULL, REFERENCES merchants(id)
 *   payloadType: ENUM('webhook', 'gstin'), NOT NULL, DEFAULT 'webhook'
 *   rawPayload: TEXT, NOT NULL
 *   createdAt: DATE
 *   updatedAt: DATE
 * }
 */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config.js';

class Payload extends Model {
    static associate(models) {
        Payload.hasOne(models.DisputeHistory, { foreignKey: 'payloadId', as: 'disputeHistory' });

        Payload.hasOne(models.DisputeLog, { foreignKey: 'payloadId', as: 'disputeLog' });
    }

}

Payload.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    merchantId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'merchants',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    businessId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'businesses',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    payloadType: {
        type: DataTypes.ENUM('webhook', 'gstin'),
        defaultValue: 'webhook',
        allowNull: false,
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
});


export default Payload;