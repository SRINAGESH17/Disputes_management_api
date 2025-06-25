
/**
 * Class responsible for processing webhooks using RabbitMQ.
 * Handles publishing webhook payloads to an exchange, consuming messages from a queue,
 * and processing webhook events.
 *
 * @class ProcessWebhook
 */
import env from '../../constants/env.js';
import ProcessWebhookPayload from '../webhook/webhookProcessor.js';
import { getChannel } from './rabbitMQ.js';

class ProcessWebhook {
    constructor() {
        this.queueName = env.RABBITMQ_QUEUE_NAME;
    }

    async start() {
        // Function to Start listening or consuming the messages from queue 
        try {
            const channel = await getChannel();
            console.log('✅ Connected to RabbitMQ');
            await channel.prefetch(1);
            await channel.assertQueue(this.queueName, { durable: true });
            await this.consumeWebhook(channel);
        } catch (error) {
            console.error('❌ Failed to start consumer:', error?.message);
            throw error;
        }
    }

    async publishToExchange(payload) {
        try {
            // Establish a connection and get a channel to RabbitMQ
            const channel = await getChannel();

            // Define the exchange name
            const exchangeName = env.RABBITMQ_EXCHANGE;

            // Assert (create if not exists) a durable direct exchange
            await channel.assertExchange(exchangeName, 'direct', { durable: true });

            // Define the queue name
            const queueName = this.queueName;

            // Assert (create if not exists) a durable queue
            await channel.assertQueue(queueName, { durable: true });

            // Bind the queue to the exchange with a specific routing key
            await channel.bindQueue(queueName, exchangeName, env.RABBITMQ_WH_ROUTING_KEY);

            // Publish a message to the exchange with the same routing key
            await channel.publish(
                exchangeName,
                env.RABBITMQ_WH_ROUTING_KEY,
                Buffer.from(JSON.stringify({ ...payload }))
            );

        } catch (error) {
            // Log any errors that occur during the process
            console.log("Failed in enqueue the webhook payload : ", error.message);
            throw error;
        }
    }

    async consumeWebhook(channel) {
        try {
            await channel.consume(this.queueName, async (msg) => {
                if (!msg) return;

                const payload = JSON.parse(msg.content.toString());

                try {
                    console.log("webhook payload received : ", payload?.merchantId);
                    await ProcessWebhookPayload(payload);
                    channel.ack(msg);
                } catch (err) {
                    console.error('Failed to process webhook:', err.message);

                    // // Optional: persist failure logs
                    // await this.logFailure(payload.merchantId, err.message);
                    channel.reject(msg, false); // Discard message (set to true to requeue)
                }
            }, { noAck: false });

            console.log(`🚀 Waiting for messages in '${this.queueName}'`);
        } catch (error) {
            console.error('❌ Error in consumeWebhook:', error.message);
        }
    }

    async logFailure(id, errorMessage) {
        // You can insert to DB or use a logger here
        console.log('📋 Logging failure:', {
            id: id || 'N/A',
            error: errorMessage
        });
    }
}

const webhookProcessor = new ProcessWebhook();

export default webhookProcessor;
