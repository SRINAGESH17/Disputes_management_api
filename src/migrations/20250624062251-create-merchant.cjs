'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('merchants', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      merchant_id: {
        type: Sequelize.STRING,
        allowNull: true,
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
      gstin: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gateways: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
      },
      total_staff: {
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
      active_disputes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      user_role: {
        type: Sequelize.INTEGER,
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('merchants', 'unique_merchant_id');
    await queryInterface.removeIndex('merchants', 'unique_merchant_email');
    await queryInterface.removeIndex('merchants', 'unique_merchant_mobile');
    await queryInterface.removeIndex('merchants', 'unique_merchant_firebase');
    await queryInterface.removeIndex('merchants', ['created_at']);

    await queryInterface.dropTable('merchants');
  },
};
// This migration script creates a 'merchants' table with various fields and indexes.