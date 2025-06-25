/**
 * DisputeLog Model
 * 
 * Represents a log entry for dispute events in the system.
 * 
 * @extends Model
 * 
 * @property {number} id - Primary key, auto-incremented.
 * @property {number} merchantId - Foreign key referencing Merchant, required.
 * @property {string} log - Description or message for the log, required, max 200 chars.
 * @property {'failed'|'success'|'pending'|'disputed'|'resolved'} status - Status of the dispute log, required.
 * @property {string} [gateway] - Payment gateway identifier (optional).
 * @property {string} [ipAddress] - IP address associated with the event (optional).
 * @property {string} [eventType] - Type of event (optional).
 * @property {string} [disputeId] - Dispute identifier (optional).
 * @property {string} [paymentId] - Payment identifier (optional).
 * @property {Date} [statusUpdatedAt] - Timestamp when status was last updated (optional).
 * @property {Date} [dueDate] - Due date for dispute resolution (optional).
 * @property {number} [payloadId] - Foreign key referencing Payload (optional).
 * @property {Date} createdAt - Timestamp when the log was created.
 * @property {Date} updatedAt - Timestamp when the log was last updated.
 * 
 * @association
 * - belongsTo Merchant (as "merchant", foreignKey: merchantId)
 * - belongsTo Payload (as "rawPayload", foreignKey: payloadId)
 * 
 * @schema
 * {
 *   id: INTEGER, PRIMARY KEY, AUTO_INCREMENT
 *   merchantId: INTEGER, NOT NULL, REFERENCES merchants(id)
 *   log: STRING(200), NOT NULL
 *   status: STRING, NOT NULL, ENUM ['failed', 'success', 'pending', 'disputed', 'resolved']
 *   gateway: STRING, NULLABLE
 *   ipAddress: STRING, NULLABLE
 *   eventType: STRING, NULLABLE
 *   disputeId: STRING, NULLABLE
 *   paymentId: STRING, NULLABLE
 *   statusUpdatedAt: DATE, NULLABLE
 *   dueDate: DATE, NULLABLE
 *   payloadId: INTEGER, NULLABLE, REFERENCES payloads(id)
 *   createdAt: DATE
 *   updatedAt: DATE
 * }
 * 
 * 
 * @table dispute_logs
 * @index merchant_id, created_at, gateway
 */

import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class DisputeLog extends Model {
    static associate(models) {
        DisputeLog.belongsTo(models.Merchant, {
            foreignKey: "merchantId",
            constraints: true,
            // onDelete: 'RESTRICT',
            as: "merchant"
        });
        DisputeLog.belongsTo(models.Payload, {
            foreignKey: "payloadId",
            as: "rawPayload",
        });
    };
}

DisputeLog.init({
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
        validate: {
            notNull: { msg: 'merchant ID is required' },
            isInt: { msg: 'merchant ID must be an integer' }
        }
    },

    log: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'log cannot be empty' },
            len: [1, 200]
        }
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        enum: ['failed', 'success', 'pending', 'disputed', 'resolved'],
    },
    gateway: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    eventType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    disputeId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    paymentId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    statusUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    payloadId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'payloads',
            key: 'id',
        },
    }

}, {
    sequelize,
    modelName: 'DisputeLog',
    tableName: 'dispute_logs',
    timestamps: true,
    indexes: [
        {
            fields: ["merchant_id"]
        },
        {
            fields: ["created_at"]
        },
        {
            fields: ["gateway"]
        }
    ]
});

export default DisputeLog;