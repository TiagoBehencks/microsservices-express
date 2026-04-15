import { Elysia } from 'elysia';

const GATEWAY_PORT = 3000;
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://order-service:3002';

async function main() {
  console.log('\n🚀 Starting API Gateway...\n');
  
  const app = new Elysia()
    .get('/', () => ({
      service: 'api-gateway',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        products: 'GET /products',
        orders: 'GET /orders, POST /orders'
      }
    }))
    .get('/products', async ({ request }) => {
      const response = await fetch(`${PRODUCT_SERVICE}/products`);
      return response.json();
    })
    .get('/products/:id', async ({ params }) => {
      const response = await fetch(`${PRODUCT_SERVICE}/products/${params.id}`);
      return response.json();
    })
    .get('/orders', async ({ request }) => {
      const response = await fetch(`${ORDER_SERVICE}/orders`);
      return response.json();
    })
    .get('/orders/:id', async ({ params }) => {
      const response = await fetch(`${ORDER_SERVICE}/orders/${params.id}`);
      return response.json();
    })
    .post('/orders', async ({ body }) => {
      const response = await fetch(`${ORDER_SERVICE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return response.json();
    })
    .listen(GATEWAY_PORT);

  console.log(`🚀 API Gateway running on http://localhost:${GATEWAY_PORT}`);
  console.log('\n📋 Available routes:');
  console.log(`   GET  /              - Health check`);
  console.log(`   GET  /products      - List all products`);
  console.log(`   GET  /products/:id   - Get product by ID`);
  console.log(`   GET  /orders        - List all orders`);
  console.log(`   GET  /orders/:id    - Get order by ID`);
  console.log(`   POST /orders        - Create new order\n`);
}

main().catch(console.error);