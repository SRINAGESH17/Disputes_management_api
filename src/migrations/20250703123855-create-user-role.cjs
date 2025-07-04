'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_roles', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      userRef: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'user_ref'
      },
      firebaseId: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'firebase_id'
      },
      analyst: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      manager: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      merchant: {
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
  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.removeIndex('user_roles', ['firebase_id']);

    await queryInterface.dropTable('user_roles');
  }
};
