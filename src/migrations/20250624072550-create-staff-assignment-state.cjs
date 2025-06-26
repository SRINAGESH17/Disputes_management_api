'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('staff_assignment_states', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
        onDelete: 'CASCADE',
      },
      last_staff_assigned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'staff',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    await queryInterface.addIndex('staff_assignment_states', ['merchant_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('staff_assignment_states', ['merchant_id']);
    await queryInterface.dropTable('staff_assignment_states');
  }
};
