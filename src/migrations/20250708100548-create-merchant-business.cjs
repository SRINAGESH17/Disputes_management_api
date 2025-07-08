'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('businesses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      merchant_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'merchants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      firebase_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      custom_business_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      gstin: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      gateways: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      business_name: {
        type: Sequelize.STRING,
        allowNull: false,
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

    await queryInterface.addIndex('businesses', ['firebase_id']);
    await queryInterface.addIndex('businesses', ['merchant_id']);
    await queryInterface.addIndex('businesses', ['custom_business_id'], {
      unique: true,
      name: 'unique_business_account',
    });

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('businesses', ['firebase_id']);
    await queryInterface.removeIndex('businesses', ['merchant_id']);
    await queryInterface.removeIndex('businesses', 'unique_business_account');

    await queryInterface.dropTable('businesses');
  }
};
