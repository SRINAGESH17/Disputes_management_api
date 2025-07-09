'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('staff_business_maps', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            staff_id: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            staff_ref: {
                type: Sequelize.ENUM('ANALYST', 'MANAGER'),
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
            firebase_id: {
                type: Sequelize.STRING,
                allowNull: false,
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

        await queryInterface.addIndex('staff_business_maps', ['merchant_id']);
        await queryInterface.addIndex('staff_business_maps', ['business_id']);
        await queryInterface.addIndex('staff_business_maps', ['staff_id', 'staff_ref']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex('staff_business_maps', ['merchant_id']);
        await queryInterface.removeIndex('staff_business_maps', ['business_id']);
        await queryInterface.removeIndex('staff_business_maps', ['staff_id', 'staff_ref']);

        await queryInterface.dropTable('staff_business_maps');
    }
};
