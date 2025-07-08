'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('disputes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      merchant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'merchants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      business_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'businesses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      analyst_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'analysts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      manager_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'managers',
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
      status: {
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
      state: {
        type: Sequelize.STRING,
        defaultValue: 'PENDING',
      },


      

      explanation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      contest_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      last_stage: {
        type: Sequelize.ENUM('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'RESUBMITTED'),
        allowNull: true,
      },
      last_stage_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updated_stage: {
        type: Sequelize.ENUM('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'RESUBMITTED'),
        allowNull: true,
        defaultValue: 'PENDING'
      },
      updated_stage_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      feedback: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      workflow_stage: {
        type: Sequelize.ENUM('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'RESUBMITTED'),
        allowNull: true,
        defaultValue: 'PENDING'
      },
      is_submitted: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
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

    // Add indexes
    await queryInterface.addIndex('disputes', ['merchant_id']);
    await queryInterface.addIndex('disputes', ['business_id']);
    await queryInterface.addIndex('disputes', ['analyst_id']);
    await queryInterface.addIndex('disputes', ['manager_id']);
    await queryInterface.addIndex('disputes', ['created_at']);
    await queryInterface.addIndex('disputes', ['due_date']);
    await queryInterface.addIndex('disputes', ['gateway']);
    await queryInterface.addIndex('disputes', ['state']);
    await queryInterface.addIndex('disputes', ['workflow_stage']);
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
    await queryInterface.removeIndex('disputes', ['business_id']);
    await queryInterface.removeIndex('disputes', ['analyst_id']);
    await queryInterface.removeIndex('disputes', ['manager_id']);
    await queryInterface.removeIndex('disputes', ['created_at']);
    await queryInterface.removeIndex('disputes', ['due_date']);
    await queryInterface.removeIndex('disputes', ['gateway']);
    await queryInterface.removeIndex('disputes', ['state']);
    await queryInterface.removeIndex('disputes', ['workflow_stage']);

    // Drop table
    await queryInterface.dropTable('disputes');
  }
};
