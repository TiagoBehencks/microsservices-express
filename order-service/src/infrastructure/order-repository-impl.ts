import { db } from "../db";
import { orders } from "../domain/entities";
import { eq } from "drizzle-orm";
import type { OrderRepository } from "../application/ports/order-repository";
import type { OrderEntity } from "../domain/entities";

export class OrderRepositoryImpl implements OrderRepository {
  async findAll() {
    return await db.select().from(orders);
  }

  async findById(orderId: string) {
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.orderId, orderId))
      .limit(1);
    return result[0];
  }

  async create(order: Omit<OrderEntity, "id" | "createdAt">) {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }
}