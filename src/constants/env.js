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
    MSG_91_TEMPLATE_ID
}

export default env;