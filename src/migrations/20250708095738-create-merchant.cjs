'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('merchants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      merchant_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mobile_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      firebase_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      total_analysts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_managers: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_disputes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      disputes_closed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      selected_business_id: {
        type: Sequelize.UUID,
        allowNull: true,
        // references: {
        //   model: 'businesses',
        //   key: 'id',
        // },
        // onUpdate: 'CASCADE',
        // onDelete: 'RESTRICT',
      },
      user_role: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'user_roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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

    await queryInterface.addIndex('merchants', ['created_at']);
    await queryInterface.addIndex('merchants', ['merchant_id'], {
      unique: true,
      name: 'unique_merchant_id',
    });
    await queryInterface.addIndex('merchants', ['email'], {
      unique: true,
      name: 'unique_merchant_email',
    });
    await queryInterface.addIndex('merchants', ['mobile_number'], {
      unique: true,
      name: 'unique_merchant_mobile',
    });
    await queryInterface.addIndex('merchants', ['firebase_id'], {
      unique: true,
      name: 'unique_merchant_firebase',
    });
    await queryInterface.addIndex('merchants', ['selected_business_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('merchants', 'unique_merchant_id');
    await queryInterface.removeIndex('merchants', 'unique_merchant_email');
    await queryInterface.removeIndex('merchants', 'unique_merchant_mobile');
    await queryInterface.removeIndex('merchants', 'unique_merchant_firebase');
    await queryInterface.removeIndex('merchants', ['created_at']);
    await queryInterface.removeIndex('merchants', ['selected_business_id']);

    await queryInterface.dropTable('merchants');
  },
};
// This migration script creates a 'merchants' table with various fields and indexes.