'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('dispute_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      merchant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'merchants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      dispute_id: {
        type: Sequelize.UUID,
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
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'payloads',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
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
