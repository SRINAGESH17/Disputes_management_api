'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('managers', {
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
        defaultValue: 'manager'
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
      total_disputes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      accepted_disputes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      rejected_disputes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      resubmitted_disputes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      pending_disputes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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

    await queryInterface.addIndex('managers', ['merchant_id']);
    await queryInterface.addIndex('managers', ['created_at']);
    await queryInterface.addIndex('managers', ['first_name', 'last_name']);
    await queryInterface.addIndex('managers', {
      fields: ['mobile_number'],
      unique: true,
      name: 'unique_manager_mobile',
    });
    await queryInterface.addIndex('managers', {
      fields: ['staff_id'],
      unique: true,
      name: 'unique_manager_staff_id',
    });
    await queryInterface.addIndex('managers', {
      fields: ['firebase_id'],
      unique: true,
      name: 'unique_manager_firebase',
    });
    await queryInterface.addIndex('managers', {
      fields: ['email'],
      unique: true,
      name: 'unique_manager_email',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('managers', 'unique_manager_mobile');
    await queryInterface.removeIndex('managers', 'unique_manager_staff_id');
    await queryInterface.removeIndex('managers', 'unique_manager_firebase');
    await queryInterface.removeIndex('managers', 'unique_manager_email');
    await queryInterface.removeIndex('managers', ['merchant_id']);
    await queryInterface.removeIndex('managers', ['created_at']);
    await queryInterface.removeIndex('managers', ['first_name', 'last_name']);

    await queryInterface.dropTable('managers');
  }
};
