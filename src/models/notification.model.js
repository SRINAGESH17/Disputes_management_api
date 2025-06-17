import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Notification extends Model { }

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
