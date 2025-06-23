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