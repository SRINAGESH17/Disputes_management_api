'use strict';


module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Dynamic import ( mjs to cjs )
    const { verificationTypes } = await import('../constants/verificationCode.js');

    await queryInterface.createTable('otp', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      verificationKey: {
        type: Sequelize.ENUM(...verificationTypes),
        allowNull: false
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
    await queryInterface.addIndex('otp', ['otp_reference', 'otp_number']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('otp', ['verification_value']);
    await queryInterface.removeIndex('otp', ['otp_reference', 'otp_number']);

    await queryInterface.dropTable('otp');
    
    // Drop enum type for postgres
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_otp_verificationKey";');
    }
  }
};
