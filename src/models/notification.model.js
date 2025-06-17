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

    payload: {
        type: DataTypes.JSONB,
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

    // ❗ Do NOT define indexes here if you're using migrations to add them
    // Define indexes via migration only to avoid duplication/conflicts
});

export default Notification;
