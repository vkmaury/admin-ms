// admin-ms/src/services/rabbitmqService.ts
import amqp from 'amqplib';

const RABBITMQ_URL = 'amqp://localhost';
const USER_INFO_REQUEST_QUEUE = 'user_info_request_queue';
// const USER_INFO_RESPONSE_QUEUE = 'user_info_response_queue';

export const requestUserInfo = async (userId: string) => {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertQueue(USER_INFO_REQUEST_QUEUE, { durable: true });
  
      const request = JSON.stringify({ userId });
      channel.sendToQueue(USER_INFO_REQUEST_QUEUE, Buffer.from(request));
  
      console.log('Sent user info request:', userId);
    } catch (error) {
      console.error('Error sending user info request:', error);
    }
  };
  