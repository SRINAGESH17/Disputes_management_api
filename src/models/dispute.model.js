/**
 * Sequelize model for representing a Dispute record.
 *
 * @class Dispute
 * @extends Model
 *
 * @property {number} id - Primary key, auto-incremented.
 * @property {number} merchantId - Foreign key referencing Merchant, required.
 * @property {number|null} staffId - Foreign key referencing Staff, optional.
 * @property {string} customId - Unique custom identifier for the dispute, required.
 * @property {string} disputeId - Unique dispute reference, required.
 * @property {string} paymentId - Payment reference, required.
 * @property {string} gateway - Payment gateway name, required.
 * @property {string} ipAddress - IP address associated with the dispute, required.
 * @property {number} amount - Disputed amount, required.
 * @property {string} currency - Currency code, required.
 * @property {string} reasonCode - Reason code for the dispute, required.
 * @property {string} reason - Description of the dispute reason, required.
 * @property {string} disputeStatus - Current status of the dispute, required.
 * @property {string} event - Event associated with the dispute, required.
 * @property {Date} statusUpdatedAt - Timestamp when status was last updated, required.
 * @property {Date} dueDate - Due date for dispute resolution, required.
 * @property {string} [type="ChargeBack"] - Type of dispute, defaults to "ChargeBack".
 * @property {string} [status="PENDING"] - Status of the dispute, defaults to "PENDING".
 * @property {Date} createdAt - Timestamp when the record was created.
 * @property {Date} updatedAt - Timestamp when the record was last updated.
 *
 * @see {@link module:models/Merchant} for merchant association.
 * @see {@link module:models/Staff} for staff association.
 * @see {@link module:models/DisputeHistory} for dispute history association.
 *
 * @static
 * @function associate
 * @description Defines associations for the Dispute model:
 * - Belongs to {@link Merchant} via `merchantId` (as `merchant`): Each dispute is linked to a single merchant.
 * - Belongs to {@link Staff} via `staffId` (as `staff`): Each dispute may be optionally linked to a staff member.
 * - Has many {@link DisputeHistory} via `disputeId` (as `disputeHistories`): Each dispute can have multiple dispute history records.
 *
 * @example
 *  Accessing associated merchant
 * const dispute = await Dispute.findByPk(1, { include: ['merchant'] });
 *
 * @example
 * // Accessing dispute histories
 * const dispute = await Dispute.findByPk(1, { include: ['disputeHistories'] });
 */

import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config.js';
import enums from '../constants/enums.constant.js';

class Dispute extends Model {
    static associate(models) {
        // Dispute Belongs To Merchant
        Dispute.belongsTo(models.Merchant, {
            foreignKey: "merchantId",
            as: "merchant"
        });
        // Dispute Belongs to Business
        Dispute.belongsTo(models.Business, {
            foreignKey: "businessId",
            as: "DisputeBusiness"
        });
        // Dispute Belongs to Manager
        Dispute.belongsTo(models.Manager, {
            foreignKey: "managerId",
            as: "DisputeManager"
        });
        // Dispute Belongs to Analyst
        Dispute.belongsTo(models.Analyst, {
            foreignKey: "analystId",
            as: "DisputeAnalyst"
        });

        // Dispute Has Many Notifications
        Dispute.hasMany(models.Notification, {
            foreignKey: "disputeId",
            as: "DisputeNotifications"
        });

        // Dispute Has Many History Records
        Dispute.hasMany(models.DisputeHistory, {
            foreignKey: "disputeId",
            as: 'disputeHistories',
        });

        // Dispute Has Many Attachments documents
        Dispute.hasMany(models.Attachment, {
            foreignKey: "disputeId",
            as: 'disputeAttachments',
        });
    };
}

Dispute.init({
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
        validate: {
            notNull: { msg: 'Merchant ID is required' },
            isUUID: {
                args: 4,
                msg: 'Merchant ID must be a valid UUIDv4'
            }
        }
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
    analystId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'analysts',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    managerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'managers',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
    status: {
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
    state: {
        type: DataTypes.STRING,
        defaultValue: "PENDING",
    },
    explanation: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    contest_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    lastStage: {
        type: DataTypes.ENUM(...enums.workflowStages),
        allowNull: true,
    },
    lastStageAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    updatedStage: {
        type: DataTypes.ENUM(...enums.workflowStages),
        allowNull: true,
        defaultValue: 'PENDING'
    },
    updatedStageAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    feedback: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    workflowStage: {
        type: DataTypes.ENUM(...enums.workflowStages),
        allowNull: true,
        defaultValue: 'PENDING'
    },
    isSubmitted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
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
            fields: ['business_id']
        },
        {
            fields: ['analyst_id']
        },
        {
            fields: ['manager_id']
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
            fields: ['state']
        },
        {
            fields: ['workflow_stage']
        },
        {
            unique: true,
            name: 'unique_custom_id',
            fields: ['custom_id']
        },
        {
            unique: true,
            name: 'unique_dispute_id',
            fields: ['dispute_id']
        },
    ]

});

// Requirements

/*
Indexes
    1. UpdatedAt - for fetching latest updated disputes
*/

export default Dispute;