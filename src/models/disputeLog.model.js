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
    gateway: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            notEmpty: { msg: 'ipAddress cannot be empty' },
            isIP: { msg: 'ipAddress must be a valid IP address' }
        }
    },
    // payload: {
    //     type: DataTypes.JSONB,
    //     allowNull: false,
    //     validate: {
    //         notEmpty: { msg: 'rowPayload cannot be empty' },
    //     }
    // },
    payloadId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'payloads',
            key: 'id',
        },
        validate: {
            notEmpty: { msg: 'rowPayload cannot be empty' },
        }
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