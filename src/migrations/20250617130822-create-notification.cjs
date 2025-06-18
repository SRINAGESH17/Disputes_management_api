'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // 1. Create ENUM types manually
    await queryInterface.sequelize.query(`CREATE TYPE "enum_notifications_type" AS ENUM ('DISPUTE', 'SYSTEM', 'INFO', 'REMINDER');`);

    await queryInterface.sequelize.query(`CREATE TYPE "enum_notifications_recipientType" AS ENUM ('STAFF', 'MERCHANT');`);

    await queryInterface.sequelize.query(`CREATE TYPE "enum_notifications_channel" AS ENUM ('EMAIL', 'WEB', 'PUSH');`);

    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      recipientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'recipient_id'
      },

      recipientType: {
        type: Sequelize.ENUM('STAFF', 'MERCHANT'),
        allowNull: false,
        field: 'recipient_type'
      },

      type: {
        type: Sequelize.ENUM('DISPUTE', 'SYSTEM', 'INFO', 'REMINDER'),
        allowNull: false,
        defaultValue: 'DISPUTE'
      },

      title: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      disputeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'dispute_id',
        references: {
          model: 'disputes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_read'
      },

      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'read_at'
      },

      channel: {
        type: Sequelize.ENUM('EMAIL', 'WEB', 'PUSH'),
        defaultValue: 'WEB'
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        field: 'created_at'
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        field: 'updated_at'
      }
    });

    // Add indexes
    await queryInterface.addIndex('notifications', ['recipient_type']);
    await queryInterface.addIndex('notifications', ['recipient_id', 'recipient_type']);
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first (optional, good practice)
    await queryInterface.removeIndex('notifications', ['recipient_type']);
    await queryInterface.removeIndex('notifications', ['recipient_id', 'recipient_type']);

    // Drop table
    await queryInterface.dropTable('notifications');

    // Clean up ENUMs (optional for Postgres)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_recipientType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_channel";');
  }
};
