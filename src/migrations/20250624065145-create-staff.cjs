'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('staff', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      staff_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      firebase_id: {
        type: Sequelize.STRING,
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
        onDelete: 'CASCADE'
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mobile_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      staff_role: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'staff'
      },
      user_role: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'user_roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'ACTIVE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('staff', ['merchant_id']);
    await queryInterface.addIndex('staff', ['created_at']);
    await queryInterface.addIndex('staff', ['first_name', 'last_name']);
    await queryInterface.addIndex('staff', {
      fields: ['mobile_number'],
      unique: true,
      name: 'unique_staff_mobile',
    });
    await queryInterface.addIndex('staff', {
      fields: ['staff_id'],
      unique: true,
      name: 'unique_staff_id',
    });
    await queryInterface.addIndex('staff', {
      fields: ['firebase_id'],
      unique: true,
      name: 'unique_staff_firebase',
    });
    await queryInterface.addIndex('staff', {
      fields: ['email'],
      unique: true,
      name: 'unique_staff_email',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('staff', 'unique_staff_mobile');
    await queryInterface.removeIndex('staff', 'unique_staff_id');
    await queryInterface.removeIndex('staff', 'unique_staff_firebase');
    await queryInterface.removeIndex('staff', 'unique_staff_email');
    await queryInterface.removeIndex('staff', ['merchant_id']);
    await queryInterface.removeIndex('staff', ['created_at']);
    await queryInterface.removeIndex('staff', ['first_name', 'last_name']);

    await queryInterface.dropTable('staff');
  }
};
