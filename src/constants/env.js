/**
 * Loads and validates required environment variables for the application.
 * Throws an error if any required variable is missing.
 *
 * @module env
 * @property {string} NODE_ENV - Current environment (e.g., DEV, PROD).
 * @property {string} PORT - Port number for the server.
 * @property {string} DEV_DB_URL - Development database connection URL.
 * @property {string} DB_NAME - Database name.
 * @property {string} DB_USER - Database user.
 * @property {string} DB_PASSWORD - Database password.
 * @property {string} DB_HOST - Database host.
 * @property {string} JWT_SECRET - JWT secret key.
 * @property {string} ZEPTO_MAIL_TOKEN - Zepto mail API token.
 * @property {string} zepto_email_template_key - Zepto email template key.
 * @property {string} MSG_91_AUTH_KEY - MSG91 authentication key.
 * @property {string} MSG_91_TEMPLATE_ID - MSG91 template ID.
 * @property {string} RABBITMQ_URL - RabbitMQ connection URL.
 * @property {string} RABBITMQ_EXCHANGE - RabbitMQ exchange name.
 * @property {string} RABBITMQ_QUEUE_NAME - RabbitMQ queue name.
 * @property {string} RABBITMQ_WH_ROUTING_KEY - RabbitMQ webhook routing key.
 * @throws {Error} If any required environment variable is not set.
 * @returns {object} An object containing all the environment variables.
 */
import dotSetup from "dotenv";
dotSetup.config();


const getEnv = (key, defaultValue) => {
    const value = process.env[key] || defaultValue;
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};

const NODE_ENV = getEnv("NODE_ENV", "DEV");
const PORT = getEnv("PORT", "4001");
const DB_NAME = getEnv("DEV_DB_NAME");
const DB_USER = getEnv("DB_USER");
const DB_PASSWORD = getEnv("DB_PASSWORD");
const DB_HOST = getEnv("DB_HOST");
const JWT_SECRET = getEnv("JWT_SECRET");
const DEV_DB_URL = getEnv("DEV_DB_URL");

const ZEPTO_MAIL_TOKEN = getEnv("ZEPTO_MAIL_TOKEN");
const zepto_email_template_key = getEnv("zepto_email_template_key");

const MSG_91_AUTH_KEY = getEnv('MSG_91_AUTH_KEY');
const MSG_91_TEMPLATE_ID = getEnv('MSG_91_TEMPLATE_ID');

const RABBITMQ_URL = getEnv('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
const RABBITMQ_EXCHANGE = getEnv('RABBITMQ_EXCHANGE');
const RABBITMQ_QUEUE_NAME = getEnv('RABBITMQ_QUEUE_NAME');
const RABBITMQ_WH_ROUTING_KEY = getEnv('RABBITMQ_WH_ROUTING_KEY');
// just add it
const env = {
    NODE_ENV,
    PORT,
    DEV_DB_URL,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    DB_HOST,
    JWT_SECRET,

    // Zepto credentials
    ZEPTO_MAIL_TOKEN,
    zepto_email_template_key,

    // MSG 91 credentials
    MSG_91_AUTH_KEY,
    MSG_91_TEMPLATE_ID,

    // rabbitMQ
    RABBITMQ_URL,
    RABBITMQ_EXCHANGE,
    RABBITMQ_QUEUE_NAME,
    RABBITMQ_WH_ROUTING_KEY
}

export default env;