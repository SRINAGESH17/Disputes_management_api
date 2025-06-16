import env from "../constants/env.js";
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(env.DEV_DB_URL, {
    dialect: 'postgres',

    // Logging: Disable in dev to reduce noise, enable in production to capture SQL queries
    logging: env.NODE_ENV === 'DEV' ? false : console.log,

    // Table config: Prevent pluralization and use snake_case
    define: {
        freezeTableName: true,  // prevents Sequelize from pluralizing table names
        underscored: true,      // converts camelCase to snake_case for columns
    },

    // Connection Pool Settings
    // pool: {
    //     max: 20,          // max number of connections in pool
    //     min: 5,           // minimum number of connections in pool
    //     acquire: 30000,   // max time (ms) to try getting a connection before throwing error
    //     idle: 10000       // time (ms) a connection can remain idle before being released
    // },
});


export default sequelize;