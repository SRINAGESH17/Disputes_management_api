'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('dispute_logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      merchant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'merchants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      log: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      gateway: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      event_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dispute_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      payment_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status_updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      payload_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'payloads',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    // Indexes
    await queryInterface.addIndex('dispute_logs', ['merchant_id']);
    await queryInterface.addIndex('dispute_logs', ['created_at']);
    await queryInterface.addIndex('dispute_logs', ['gateway']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('dispute_logs', ['merchant_id']);
    await queryInterface.removeIndex('dispute_logs', ['created_at']);
    await queryInterface.removeIndex('dispute_logs', ['gateway']);

    await queryInterface.dropTable('dispute_logs');
  }
};
