import amqp from 'amqplib';
import env from '../../constants/env.js';

let connection = null;
let channel = null;

async function connectToRabbitMQ() {
    // @description  Connecting to RabbitMQ Server for enqueue
    if (connection) return connection;
    try {
        connection = await amqp.connect(env.RABBITMQ_URL);
        connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err.message);
            connection = null;
        });
        connection.on('close', () => {
            console.warn('RabbitMQ connection closed');
            connection = null;
        });
        return connection;
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error.message);
        throw error;
    }
}

async function getChannel() {
    // @description   Get the Channel for the Publishing The Messages Into Queue
    if (channel) return channel;
    try {
        const conn = await connectToRabbitMQ();
        channel = await conn.createChannel();
        channel.on('error', (err) => {
            console.error('RabbitMQ channel error:', err.message);
            channel = null;
        });
        channel.on('close', () => {
            console.warn('RabbitMQ channel closed');
            channel = null;
        });
        return channel;
    } catch (error) {
        console.error('Error creating RabbitMQ channel:', error.message);
        throw error;
    }
}

export {
    connectToRabbitMQ,
    getChannel
};