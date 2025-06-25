/**
 * Notification Model
 *
 * Represents a notification sent to either a Staff or Merchant user, optionally related to a Dispute.
 *
 * @augments Model
 *
 * @typedef {Object} Notification
 * @property {number} id - Primary key, auto-incremented.
 * @property {number} recipientId - ID of the recipient (Staff or Merchant).
 * @property {'STAFF'|'MERCHANT'} recipientType - Type of the recipient.
 * @property {'DISPUTE'|'SYSTEM'|'INFO'|'REMINDER'} type - Type/category of the notification.
 * @property {string} title - Title of the notification.
 * @property {string} message - Body/message of the notification.
 * @property {?number} disputeId - Optional Dispute ID if the notification is related to a dispute.
 * @property {boolean} isRead - Whether the notification has been read.
 * @property {?Date} readAt - Timestamp when the notification was read.
 * @property {'EMAIL'|'WEB'|'PUSH'} channel - Channel through which the notification was sent.
 * @property {Date} createdAt - Timestamp when the notification was created.
 * @property {Date} updatedAt - Timestamp when the notification was last updated.
 *
 * @see {@link https://sequelize.org/docs/v6/core-concepts/model-basics/}
 *
 * @example
 * // Creating a new notification
 * await Notification.create({
 *   recipientId: 1,
 *   recipientType: 'STAFF',
 *   type: 'DISPUTE',
 *   title: 'New Dispute Assigned',
 *   message: 'A new dispute has been assigned to you.',
 *   disputeId: 123,
 *   channel: 'WEB'
 * });
 *
 * @schema
 * {
 *   id: BIGINT (PK, auto-increment),
 *   recipientId: INTEGER (FK to Staff or Merchant, required),
 *   recipientType: ENUM('STAFF', 'MERCHANT') (required),
 *   type: ENUM('DISPUTE', 'SYSTEM', 'INFO', 'REMINDER') (default: 'DISPUTE'),
 *   title: TEXT (required),
 *   message: TEXT (required),
 *   disputeId: INTEGER (nullable, FK to disputes),
 *   isRead: BOOLEAN (default: false),
 *   readAt: DATE (nullable),
 *   channel: ENUM('EMAIL', 'WEB', 'PUSH') (default: 'WEB'),
 *   createdAt: DATE,
 *   updatedAt: DATE
 * }
 */
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Notification extends Model {
    /**
     * Defines associations between the Notification model and other models.
     * 
     * - Associates Notification with Staff as 'staffRecipient' when recipientType is 'STAFF'.
     * - Associates Notification with Merchant as 'merchantRecipient' when recipientType is 'MERCHANT'.
     * - Associates Notification with Dispute as 'dispute'.
     * 
     * @param {object} models - An object containing all Sequelize models.
     */
    static associate(models) {

        Notification.belongsTo(models.Staff, {
            foreignKey: 'recipientId',
            constraints: false,
            as: 'staffRecipient',
            scope: {
                recipientType: 'STAFF'
            }
        });
        Notification.belongsTo(models.Merchant, {
            foreignKey: 'recipientId',
            constraints: false,
            as: 'merchantRecipient',
            scope: {
                recipientType: 'MERCHANT'
            }
        });
        Notification.belongsTo(models.Dispute, {
            foreignKey: 'disputeId',
            as: 'dispute'
        });
    }
}

Notification.init({
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },

    recipientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    recipientType: {
        type: DataTypes.ENUM('STAFF', 'MERCHANT'),
        allowNull: false,
    },

    type: {
        type: DataTypes.ENUM('DISPUTE', 'SYSTEM', 'INFO', 'REMINDER'),
        allowNull: false,
        defaultValue: 'DISPUTE',
    },

    title: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    disputeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'disputes',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },

    readAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    channel: {
        type: DataTypes.ENUM('EMAIL', 'WEB', 'PUSH'),
        defaultValue: 'WEB',
    }

}, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        {
            fields: ['recipient_type']
        },
        {
            fields: ['recipient_id', 'recipient_type']
        },
    ]

});

export default Notification;
