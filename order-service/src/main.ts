import { Elysia } from "elysia";

import { connectDatabase } from "./db";
import { migrate } from "./migrate";
import { connectRabbitMQ, publishOrderCreated } from "./rabbitmq";
import { OrderRepositoryImpl } from "./infrastructure/order-repository-impl";
import { CreateOrderUseCase, ListOrdersUseCase, GetOrderUseCase } from "./application/usecases/order-usecases";
import { getProduct, checkStock, reduceStock } from "./grpc-client";

const ORDER_HTTP_PORT = 3002;

async function main() {
  console.log("\n🛒 Starting Order Service...\n");

  await connectDatabase();
  await migrate();
  await connectRabbitMQ();

  const orderRepository = new OrderRepositoryImpl();
  const createOrderUseCase = new CreateOrderUseCase(
    orderRepository,
    getProduct,
    checkStock,
    reduceStock,
    publishOrderCreated
  );
  const listOrdersUseCase = new ListOrdersUseCase(orderRepository);
  const getOrderUseCase = new GetOrderUseCase(orderRepository);

  const app = new Elysia()
    .get("/", () => ({
      service: "order-service",
      status: "running",
      timestamp: new Date().toISOString(),
    }))
    .get("/orders", async () => await listOrdersUseCase.execute())
    .get("/orders/:id", async ({ params }) => {
      const order = await getOrderUseCase.execute(params.id);
      if (!order) {
        return { error: "Order not found", status: 404 };
      }
      return order;
    })
    .post("/orders", async ({ body }) => {
      const { productId, quantity, customerEmail } = body as any;

      if (!productId || !quantity || !customerEmail) {
        return { error: "Missing required fields", status: 400 };
      }

      return createOrderUseCase.execute(productId, Number(quantity), customerEmail);
    })
    .listen(ORDER_HTTP_PORT);

  console.log(`🛒 Order Service HTTP running on http://localhost:${ORDER_HTTP_PORT}`);
  console.log("✅ Order Service fully operational!\n");
}

main().catch(console.error);