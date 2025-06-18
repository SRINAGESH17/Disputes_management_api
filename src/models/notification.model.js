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
