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
      },
      userRef: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      firebaseId: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'firebase_id'
      },
      staff: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissions: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
      },
      merchant: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      navbarPermissions: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        field: 'navbar_permissions'
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
