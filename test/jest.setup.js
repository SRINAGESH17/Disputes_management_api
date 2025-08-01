import { GenericContainer } from 'testcontainers';
import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import supertest from 'supertest';
import createApp from '../src/app.js';
import initModels from '../src/models/init-models.js';

// workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Function to load seed data from JSON files
const loadSeedData = (filename) => {
  const filePath = path.join(__dirname, '../src/seed-data', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

let container, sequelize;

// Jest setup file to initialize the database and models
beforeAll(async () => {
  container = await new GenericContainer('postgres')
    .withEnv('POSTGRES_PASSWORD', 'test')
    .withEnv('POSTGRES_DB', 'testdb')
    .withExposedPorts(5432)
    .start();

  // Initialize Sequelize with the test database
  sequelize = new Sequelize('testdb', 'postgres', 'test', {
    host: container.getHost(),
    port: container.getMappedPort(5432),
    dialect: 'postgres',
    logging: false,
  });

  // Initialize models and sync the database with seed data
  const models = initModels(sequelize, DataTypes);
  sequelize.models = models;

  // Authenticate and sync the database
  await sequelize.authenticate();
  console.log('Database connection established successfully.');
  // await sequelize.sync({ force: true });

  // await models.User.bulkCreate(loadSeedData('users.json'));
  // await models.Category.bulkCreate(loadSeedData('categories.json'));

  const app = createApp(sequelize);
  const request = supertest(app);

  global.request = request;
  global.models = models;
  global.sequelize = sequelize;
});

afterAll(async () => {
  await sequelize.close();
  await container.stop();
});
