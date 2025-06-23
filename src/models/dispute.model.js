import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Dispute extends Model {
    static associate(models) {
        Dispute.belongsTo(models.Merchant, {
            foreignKey: "merchantId",
            as: "merchant"
        });
        Dispute.belongsTo(models.Staff, {
            foreignKey: "staffId",
            as: "staff"
        });
        Dispute.hasMany(models.DisputeHistory, {
            foreignKey: "disputeId",
            constraints: true,
            // onDelete: 'RESTRICT', // when a dispute is deleted, the history is not deleted
            as: {
                singular: "disputeHistory",
                plural: "disputeHistories"
            },
        });
    };
}

Dispute.init({
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
            notNull: { msg: 'Merchant ID is required' },
            isInt: { msg: 'Merchant ID must be an integer' }
        }
    },
    staffId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'staff',
            key: 'id',
        },
        validate: {
            isInt: { msg: 'Staff ID must be an integer' }
        }
    },
    customId: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: 'customId is required' },
        },
    },
    disputeId: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'dispute reference cannot be empty' },
            len: [3, 50]
        },
    },
    paymentId: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'payment reference cannot be empty' },
            len: [3, 50]
        }
    },
    gateway: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'gateway cannot be empty' },
            len: [3, 30]
        }
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIP: true,
            notEmpty: { msg: 'IP address cannot be empty' },    
        }
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'amount cannot be empty' },
            isDecimal: { msg: 'amount must be a decimal' }
        }
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'currency cannot be empty' },
        }
    },
    reasonCode: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'reason code cannot be empty' },
        }
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'reason code cannot be empty' },
        }
    },
    disputeStatus: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    event: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    statusUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
            isDate: { msg: 'statusUpdateAt must be a date' },
        }
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: { msg: 'dueDate must be a date' },
        }
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: "ChargeBack",
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "PENDING",
    },

}, {
    sequelize,
    modelName: 'Dispute',
    tableName: 'disputes',
    timestamps: true,
    indexes: [
        {
            fields: ['merchant_id']
        },
        {
            unique: true,
            name: 'unique_custom_id',
            fields: ['custom_id']
        },
        {
            fields: ['staff_id']
        },
        {
            unique: true,
            name: 'unique_dispute_id',
            fields: ['dispute_id']
        },
        {
            fields: ['created_at']
        },
        {
            fields: ['due_date']
        },
        {
            fields: ['gateway']
        },
        {
            fields: ['status']
        },

    ]

});

export default Dispute;