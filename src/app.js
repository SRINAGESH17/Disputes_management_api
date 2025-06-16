import express from 'express';
import env from './constants/env.js';
import { initializeDB } from './models/index.js';
import indexRoutes from './routes/index.js';


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});
app.use('/', indexRoutes);

// Setting up the server
const startServer = async () => {
    try {
        // Connect to DB and load all resources
        await initializeDB();
        app.listen(env.PORT, () => {
            console.log("Server is Started");
            console.log(`Server running on http://localhost:${env.PORT}`);
        });
    } catch (error) {
        console.error('Initialization failed:', error);
        process.exit(1);
    }
};

startServer();

export default app;
