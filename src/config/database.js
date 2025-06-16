import env from "../constants/env.js";
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
    env.DEV_DB_URL,
    {
        dialect: 'postgres',
        logging: env.NODE_ENV === 'DEV' ? false : true, // set to true to see SQL queries in console,
        define: {
            freezeTableName: true,
            underscored: true
        },
    }
);

export default sequelize;