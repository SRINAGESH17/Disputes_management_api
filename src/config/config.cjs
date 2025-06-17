
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
