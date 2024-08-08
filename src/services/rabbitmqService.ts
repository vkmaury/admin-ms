// admin-ms/src/services/rabbitmqService.ts
import amqp from 'amqplib';

const RABBITMQ_URL = 'amqp://localhost';
const DISCOUNT_QUEUE = 'apply_discount_queue';

export const sendDiscountApplication = async (productId: string, discountCode: string) => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(DISCOUNT_QUEUE, { durable: true });

    const message = JSON.stringify({ productId, discountCode });
    channel.sendToQueue(DISCOUNT_QUEUE, Buffer.from(message), { persistent: true });

    console.log('Discount application message sent:', message);

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error sending discount application message:', error);
  }
};
