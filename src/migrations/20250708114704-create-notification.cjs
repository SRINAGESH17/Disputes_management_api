'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      business_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'businesses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      recipient_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      recipient_type: {
        type: Sequelize.ENUM('ANALYST', 'MANAGER', 'MERCHANT'),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('DISPUTE', 'SYSTEM', 'INFO', 'REMINDER'),
        allowNull: false,
        defaultValue: 'DISPUTE',
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      dispute_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'disputes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      channel: {
        type: Sequelize.ENUM('EMAIL', 'WEB', 'PUSH'),
        defaultValue: 'WEB',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });

    await queryInterface.addIndex('notifications', ['recipient_id','created_at']);
    await queryInterface.addIndex('notifications', ['business_id','recipient_id','created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('notifications', ['recipient_id','created_at']);
    await queryInterface.removeIndex('notifications',  ['business_id','recipient_id','created_at']);

    await queryInterface.dropTable('notifications');

    // Clean up ENUM types (PostgreSQL only)
    // if (queryInterface.sequelize.getDialect() === 'postgres') {
    //   await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_recipient_type";');
    //   await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
    //   await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_channel";');
    // }
  }
};
