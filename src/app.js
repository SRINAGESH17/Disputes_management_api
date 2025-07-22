import express from 'express';
import env from './constants/env.constant.js';
import { initializeDB } from './models/index.js';
import indexRoutes from './routes/index.js';
import webhookProcessor from './controllers/rabbitmq/process-webhook.class.js';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

app.use(cors());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

// Entry Point
app.use('/', indexRoutes);


// Setting up the server
const startServer = async () => {
    try {
        // Connect to DB and load all resources
        await initializeDB();

        // Listen Channel To Consume the letters From Queue
        await webhookProcessor.start();

        // Start the Server
        app.listen(env.PORT, () => {
            // console.log("Server is Started");
            console.log(`🌐 Server running on http://localhost:${env.PORT}`);
        });
    } catch (error) {
        console.error('Initialization failed:', error);
        process.exit(1);
    }
};

startServer();

export default app;
