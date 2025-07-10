'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addConstraint('merchants', {
      fields: ['selected_business_id'],
      type: 'foreign key',
      name: 'fk_merchants_selected_business_id',
      references: {
        table: 'businesses',
        field: 'id'
      },
      onDelete: 'SET NULL' // or CASCADE
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('merchants', 'fk_merchants_selected_business_id');
  }
};
