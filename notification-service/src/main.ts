import { Elysia } from 'elysia';
import { startConsumer } from './consumer';

const NOTIFICATION_HTTP_PORT = 3003;

async function main() {
  console.log('\n📧 Starting Notification Service...\n');
  
  await startConsumer();
  
  const app = new Elysia()
    .get('/', () => ({
      service: 'notification-service',
      status: 'running',
      timestamp: new Date().toISOString()
    }))
    .listen(NOTIFICATION_HTTP_PORT);

  console.log(`📧 Notification Service HTTP running on http://localhost:${NOTIFICATION_HTTP_PORT}`);
  console.log('📧 Waiting for events from RabbitMQ...\n');
}

main().catch(console.error);