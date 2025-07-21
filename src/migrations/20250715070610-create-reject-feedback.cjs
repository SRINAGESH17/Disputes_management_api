'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reject_feedbacks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
      dispute_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'disputes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_rejected_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      user_rejected_ref: {
        type: Sequelize.ENUM('MERCHANT', 'MANAGER'),
        allowNull: false,
      },
      rejected_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      feedback: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      comments: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      file_names: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });

    await queryInterface.addIndex('reject_feedbacks', ['dispute_id']);
  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.removeIndex('reject_feedbacks', ['dispute_id']);
    
    await queryInterface.dropTable('reject_feedbacks');
  }
};