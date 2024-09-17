// admin-ms/src/services/rabbitmqService.ts
import amqp from 'amqplib';

export const RABBITMQ_URL = 'amqp://localhost'; // Or your RabbitMQ URL

const USER_INFO_RESPONSE_QUEUE = 'user_info_response_queue';

export const startUserInfoResponseConsumer = async () => {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertQueue(USER_INFO_RESPONSE_QUEUE, { durable: true });
  
      console.log('Waiting for messages in %s', USER_INFO_RESPONSE_QUEUE);
  
      channel.consume(USER_INFO_RESPONSE_QUEUE, (msg) => {
        if (msg !== null) {
          const userInfo = JSON.parse(msg.content.toString());
  
          // Process the user info response here
          console.log('Received user info response:', userInfo);
  
          channel.ack(msg);
        }
      });
    } catch (error) {
      console.error('Error setting up RabbitMQ response consumer:', error);
    }
  };
  