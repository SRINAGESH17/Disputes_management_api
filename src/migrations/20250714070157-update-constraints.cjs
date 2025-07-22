'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    // For Analyst
    // Remove the old foreign key constraint
    await queryInterface.removeConstraint('analysts', 'analysts_selected_business_id_fkey'); // The constraint name may be different in your DB

    // Add new foreign key constraint referencing businesses(id)
    await queryInterface.addConstraint('analysts', {
      fields: ['selected_business_id'],
      type: 'foreign key',
      name: 'analysts_selected_business_id_businesses_fk', // Name your constraint
      references: {
        table: 'businesses',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    // For Manager
    // Remove the old foreign key constraint
    await queryInterface.removeConstraint('managers', 'managers_selected_business_id_fkey'); // The constraint name may be different in your DB

    // Add new foreign key constraint referencing businesses(id)
    await queryInterface.addConstraint('managers', {
      fields: ['selected_business_id'],
      type: 'foreign key',
      name: 'managers_selected_business_id_businesses_fk', // Name your constraint
      references: {
        table: 'businesses',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // For Analyst
    // Remove the new constraint
    await queryInterface.removeConstraint('analysts', 'analysts_selected_business_id_businesses_fk');

    // Add back the old constraint referencing staff_business_maps
    await queryInterface.addConstraint('analysts', {
      fields: ['selected_business_id'],
      type: 'foreign key',
      name: 'analysts_selected_business_id_fkey',
      references: {
        table: 'staff_business_maps',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    // For Manager
    // Remove the new constraint
    await queryInterface.removeConstraint('managers', 'managers_selected_business_id_businesses_fk');

    // Add back the old constraint referencing staff_business_maps
    await queryInterface.addConstraint('managers', {
      fields: ['selected_business_id'],
      type: 'foreign key',
      name: 'managers_selected_business_id_fkey',
      references: {
        table: 'staff_business_maps',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  }
};