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