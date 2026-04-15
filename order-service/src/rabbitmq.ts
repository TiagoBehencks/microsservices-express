import amqp, { Connection, Channel } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const ORDER_CREATED_QUEUE = 'order.created';

let connection: Connection | null = null;
let channel: Channel | null = null;

async function waitForRabbitMQ(retries = 10, delay = 2000): Promise<Channel> {
  for (let i = 0; i < retries; i++) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      
      connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err.message);
      });
      
      connection.on('close', () => {
        console.error('RabbitMQ connection closed');
        channel = null;
        connection = null;
      });
      
      channel = await connection.createChannel();
      
      await channel.assertQueue(ORDER_CREATED_QUEUE, { durable: true });
      
      console.log('🐰 Connected to RabbitMQ');
      return channel;
    } catch (err) {
      if (i < retries - 1) {
        console.log(`⏳ Waiting for RabbitMQ... (${i + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Failed to connect to RabbitMQ');
}

export async function connectRabbitMQ(): Promise<Channel> {
  if (channel) return channel;
  return waitForRabbitMQ();
}

export interface OrderCreatedEvent {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  customerEmail: string;
  createdAt: string;
}

export async function publishOrderCreated(event: OrderCreatedEvent): Promise<void> {
  if (!channel) {
    await connectRabbitMQ();
  }
  
  const message = Buffer.from(JSON.stringify(event));
  channel!.sendToQueue(ORDER_CREATED_QUEUE, message, { persistent: true });
  
  console.log(`📤 Published order.created event: ${event.orderId}`);
}

export async function closeRabbitMQ(): Promise<void> {
  if (channel) await channel.close();
  if (connection) await connection.close();
}