'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('dispute_history', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
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
      dispute_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'disputes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      updated_status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      updated_event: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status_update_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

    await queryInterface.addIndex('dispute_history', ['merchant_id']);
    await queryInterface.addIndex('dispute_history', ['dispute_id']);
    await queryInterface.addIndex('dispute_history', ['merchant_id', 'dispute_id']);
    await queryInterface.addIndex('dispute_history', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('dispute_history', ['merchant_id']);
    await queryInterface.removeIndex('dispute_history', ['dispute_id']);
    await queryInterface.removeIndex('dispute_history', ['merchant_id', 'dispute_id']);
    await queryInterface.removeIndex('dispute_history', ['created_at']);

    await queryInterface.dropTable('dispute_history');
  }
};
