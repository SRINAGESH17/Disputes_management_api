'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('attachments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
      custom_dispute_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      user_uploaded_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      user_uploaded_ref: {
        type: Sequelize.ENUM('ANALYST', 'MERCHANT'),
        allowNull: false,
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      size_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      size: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      is_latest: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      format: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      stage: {
        type: Sequelize.ENUM('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'RESUBMITTED'),
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

    await queryInterface.addIndex('attachments', ['merchant_id']);
    await queryInterface.addIndex('attachments', ['business_id']);
    await queryInterface.addIndex('attachments', ['dispute_id']);
    await queryInterface.addIndex('attachments', ['custom_dispute_id']);
    await queryInterface.addIndex('attachments', ['created_at']);
    await queryInterface.addIndex('attachments', ['business_id', 'custom_dispute_id', 'created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('attachments', ['merchant_id']);
    await queryInterface.removeIndex('attachments', ['business_id']);
    await queryInterface.removeIndex('attachments', ['dispute_id']);
    await queryInterface.removeIndex('attachments', ['custom_dispute_id']);
    await queryInterface.removeIndex('attachments', ['created_at']);
    await queryInterface.removeIndex('attachments', ['business_id', 'custom_dispute_id', 'created_at']);
    await queryInterface.dropTable('attachments');
  }
};