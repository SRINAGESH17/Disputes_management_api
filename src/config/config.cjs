/**
 * Loads environment variables from a .env file into process.env.
 * 
 * @module config
 * @description Database configuration object for different environments.
 * @type {Object}
 * @property {Object} development - Development environment configuration.
 * @property {string} development.username - Database username from environment variable DB_USER.
 * @property {string} development.password - Database password from environment variable DB_PASSWORD.
 * @property {string} development.database - Database name from environment variable DEV_DB_NAME.
 * @property {string} development.host - Database host from environment variable DB_HOST.
 * @property {string} development.dialect - Database dialect, set to 'postgres'.
 */
require('dotenv').config(); // This stays CommonJS!

const config = {
    development: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DEV_DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'postgres',
    }
}

module.exports = config;
