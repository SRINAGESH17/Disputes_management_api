/**
 * Initializes and exports a Sequelize instance configured for PostgreSQL.
 *
 * @module config/database
 * @requires module:constants/env
 * @requires sequelize
 *
 * @constant
 * @type {Sequelize}
 * @description
 * - Connects to the database using the connection string from environment variables.
 * - Uses PostgreSQL as the database dialect.
 * - Disables SQL query logging in development, enables it otherwise.
 * - Prevents automatic pluralization of table names and enforces snake_case for columns.
 * - (Optional) Connection pool settings can be customized as needed.
 *
 * @see {@link https://sequelize.org/master/class/lib/sequelize.js~Sequelize.html|Sequelize Documentation}
 */

import env from "../constants/env.constant.js";
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