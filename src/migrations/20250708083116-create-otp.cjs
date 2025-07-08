'use strict';


module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.createTable('otp', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      verificationKey: {
        type: Sequelize.ENUM('email', 'mobile_number'),
        allowNull: false,
        field: 'verification_key'
      },
      verificationValue: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'verification_value'
      },
      otpReference: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'otp_reference'
      },
      otpNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'otp_number'
      },
      expiresIn: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'expires_in'
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_verified'
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

    await queryInterface.addIndex('otp', ['verification_value']);
    await queryInterface.addIndex('otp', ['verification_key', 'verification_value']);
    await queryInterface.addIndex('otp', ['verification_key', 'verification_value', 'otp_reference']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('otp', ['verification_value']);
    await queryInterface.removeIndex('otp', ['verification_key', 'verification_value']);
    await queryInterface.removeIndex('otp', ['verification_key', 'verification_value', 'otp_reference']);

    await queryInterface.dropTable('otp');
  }
};
