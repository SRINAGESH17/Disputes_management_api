'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('disputes', {
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
      staff_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'staff',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      custom_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dispute_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payment_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      gateway: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      reason_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dispute_status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      event: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status_updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        defaultValue: 'ChargeBack',
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'PENDING',
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

    // Add indexes
    await queryInterface.addIndex('disputes', ['merchant_id']);
    await queryInterface.addIndex('disputes', ['staff_id']);
    await queryInterface.addIndex('disputes', ['created_at']);
    await queryInterface.addIndex('disputes', ['due_date']);
    await queryInterface.addIndex('disputes', ['gateway']);
    await queryInterface.addIndex('disputes', ['status']);
    await queryInterface.addIndex('disputes', {
      fields: ['custom_id'],
      unique: true,
      name: 'unique_custom_id',
    });
    await queryInterface.addIndex('disputes', {
      fields: ['dispute_id'],
      unique: true,
      name: 'unique_dispute_id',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('disputes', 'unique_custom_id');
    await queryInterface.removeIndex('disputes', 'unique_dispute_id');
    await queryInterface.removeIndex('disputes', ['merchant_id']);
    await queryInterface.removeIndex('disputes', ['staff_id']);
    await queryInterface.removeIndex('disputes', ['created_at']);
    await queryInterface.removeIndex('disputes', ['due_date']);
    await queryInterface.removeIndex('disputes', ['gateway']);
    await queryInterface.removeIndex('disputes', ['status']);

    // Drop table
    await queryInterface.dropTable('disputes');
  }
};
