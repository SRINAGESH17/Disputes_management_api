'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_roles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'user_id',
      },
      userRef: {
        type: Sequelize.ENUM('MERCHANT', 'ANALYST', 'MANAGER'),
        allowNull: false,
        field: 'user_ref'
      },
      firebaseId: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'firebase_id'
      },
      merchant: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      manager: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      analyst: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });

    await queryInterface.addIndex('user_roles', ['firebase_id']);
    await queryInterface.addIndex('user_roles', ['user_id', 'user_ref']);
  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.removeIndex('user_roles', ['firebase_id']);
    await queryInterface.removeIndex('user_roles', ['user_id', 'user_ref']);

    await queryInterface.dropTable('user_roles');
  }
};