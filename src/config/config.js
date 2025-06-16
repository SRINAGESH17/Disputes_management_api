import env from "../constants/env.js";

export default {
    development: {
        username: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        host: env.DB_HOST,
        dialect: 'postgres'
    },
    test: {
        username: "root",
        password: null,
        database: "database_test",
        host: "127.0.0.1",
        dialect: "postgres"
    },
    production: {
        username: "root",
        password: null,
        database: "database_production",
        host: "127.0.0.1",
        dialect: "postgres"
    }
}
