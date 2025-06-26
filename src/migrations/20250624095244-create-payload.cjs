'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payloads', {
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
      payload_type: {
        type: Sequelize.ENUM('webhook', 'gstin'),
        defaultValue: 'webhook',
        allowNull: false,
      },
      raw_payload: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      }
    });

    await queryInterface.addIndex('payloads', ['merchant_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('payloads', ['merchant_id']);
    await queryInterface.dropTable('payloads');
  }
};
