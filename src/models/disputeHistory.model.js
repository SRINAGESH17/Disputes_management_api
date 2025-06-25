/**
 * DisputeHistory Model
 * 
 * Represents the history of status and event updates for a Dispute.
 * 
 * @typedef {Object} DisputeHistory
 * @property {number} id - Primary key, auto-incremented.
 * @property {number} merchantId - Foreign key referencing Merchant (required).
 * @property {number} disputeId - Foreign key referencing Dispute (required).
 * @property {string} updatedStatus - The updated status of the dispute (required, 3-50 chars).
 * @property {string} updatedEvent - The event that triggered the update (required, 3-50 chars).
 * @property {Date} statusUpdateAt - The timestamp when the status was updated (required).
 * @property {number|null} payloadId - Foreign key referencing Payload (optional).
 * @property {Date} createdAt - Timestamp when the record was created (managed by Sequelize).
 * @property {Date} updatedAt - Timestamp when the record was last updated (managed by Sequelize).
 * 
 * @see {@link models.Dispute} - Associated Dispute model (belongsTo, as: "dispute", foreignKey: "disputeId")
 * @see {@link models.Merchant} - Associated Merchant model (belongsTo, as: "merchant", foreignKey: "merchantId")
 * @see {@link models.Payload} - Associated Payload model (belongsTo, as: "rawPayload", foreignKey: "payloadId")
 * 
 * @class DisputeHistory
 * @extends Model
 * 
 * @example
 * Creating a new DisputeHistory record
 * DisputeHistory.create({
 *   merchantId: 1,
 *   disputeId: 10,
 *   updatedStatus: 'RESOLVED',
 *   updatedEvent: 'STATUS_CHANGE',
 *   statusUpdateAt: new Date(),
 *   payloadId: 5
 * });
 */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class DisputeHistory extends Model {
    static associate(models) {
        DisputeHistory.belongsTo(models.Dispute, {
            foreignKey: "disputeId",
            as: "dispute"
        });
        DisputeHistory.belongsTo(models.Merchant, {
            foreignKey: "merchantId",
            as: "merchant",
        });
        DisputeHistory.belongsTo(models.Payload, {
            foreignKey: "payloadId",
            as: "rawPayload",
        });
    };
}

DisputeHistory.init({
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
    disputeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'disputes',
            key: 'id',
        },
        validate: {
            notNull: { msg: 'dispute ID is required' },
            isInt: { msg: 'dispute ID must be an integer' }
        }
    },

    updatedStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'dispute status cannot be empty' },
            len: [3, 50]
        }
    },
    updatedEvent: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'dispute status cannot be empty' },
            len: [3, 50]
        }
    },

    statusUpdateAt: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: { msg: 'statusUpdateAt must be a date' },
        }
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
    modelName: 'DisputeHistory',
    tableName: 'dispute_history',
    timestamps: true,
    indexes: [
        {
            fields: ["merchant_id"]
        },
        {
            fields: ["merchant_id", "dispute_id"]
        },
        {
            fields: ["dispute_id"]
        },
        {
            fields: ["created_at"]
        }
    ]
});

export default DisputeHistory;