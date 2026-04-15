import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const ORDER_CREATED_QUEUE = 'order.created';

interface OrderCreatedEvent {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  customerEmail: string;
  createdAt: string;
}

export async function startConsumer(): Promise<void> {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  
  await channel.assertQueue(ORDER_CREATED_QUEUE, { durable: true });
  await channel.prefetch(1);
  
  console.log('📧 Notification Service waiting for messages...\n');
  
  channel.consume(ORDER_CREATED_QUEUE, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    
    try {
      const event: OrderCreatedEvent = JSON.parse(msg.content.toString());
      
      console.log('\n📧 Received order.created event:');
      console.log(`   Order ID: ${event.orderId}`);
      console.log(`   Product: ${event.productName}`);
      console.log(`   Quantity: ${event.quantity}`);
      console.log(`   Total: $${event.totalPrice.toFixed(2)}`);
      console.log(`   Customer: ${event.customerEmail}`);
      
      await sendEmail(event);
      
      channel.ack(msg);
      
      console.log('✅ Email notification sent!\n');
    } catch (err) {
      console.error('❌ Error processing message:', err);
      channel.nack(msg, false, false);
    }
  });
}

async function sendEmail(event: OrderCreatedEvent): Promise<void> {
  console.log(`\n📧 Sending email to ${event.customerEmail}...`);
  console.log(`   Subject: Order Confirmation - ${event.orderId}`);
  console.log(`   Body: Thank you for your order! We've received your order for ${event.quantity}x ${event.productName}.`);
  console.log(`   Total amount: $${event.totalPrice.toFixed(2)}`);
  
  await new Promise(resolve => setTimeout(resolve, 500));
}