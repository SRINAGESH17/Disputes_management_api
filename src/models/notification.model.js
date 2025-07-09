/**
 * Notification Model
 *
 * Represents a notification sent to either a Staff or Merchant user, optionally related to a Dispute.
 *
 * @augments Model
 *
 * @typedef {Object} Notification
 * @property {number} id - Primary key, auto-incremented.
 * @property {number} businessId - ID of the businesses.
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
 *   recipientId:  4h4h-nj4j5j5j-6j7k8h3,
 *   recipientId: 4h4h-nj4j5j5j-6j7k8h,
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
 *   recipientId: UUID (FK to businesses, required),
 *   recipientId: UUID (FK to Staff or Merchant, required),
 *   recipientType: ENUM('STAFF', 'MERCHANT') (required),
 *   type: ENUM('DISPUTE', 'SYSTEM', 'INFO', 'REMINDER') (default: 'DISPUTE'),
 *   title: TEXT (required),
 *   message: TEXT (required),
 *   disputeId: UUID (nullable, FK to disputes),
 *   isRead: BOOLEAN (default: false),
 *   readAt: DATE (nullable),
 *   channel: ENUM('EMAIL', 'WEB', 'PUSH') (default: 'WEB'),
 *   createdAt: DATE,
 *   updatedAt: DATE
 * }
 */
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.config.js';
import enums from '../constants/enums.constant.js';

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

        // Notification belongs to business
        Notification.belongsTo(models.Business, {
            foreignKey: 'businessId',
            as: 'NotificationBusiness',
        });

        // Notification belongs to Dispute
        Notification.belongsTo(models.Dispute, {
            foreignKey: 'disputeId',
            as: 'notificationDispute',
        });

    }
}

Notification.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    businessId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'businesses',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },

    recipientId: {
        type: DataTypes.UUID,
        allowNull: false,
    },

    recipientType: {
        type: DataTypes.ENUM(...enums.userNames),
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
        type: DataTypes.UUID,
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
            fields: ['recipient_id','created_at']
        },
        {
            fields: ['business_id','recipient_id','created_at']
        },
    ]

});

export default Notification;
