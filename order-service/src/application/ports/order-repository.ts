import type { OrderEntity } from "../domain/entities";

export interface OrderRepository {
  findAll(): Promise<OrderEntity[]>;
  findById(orderId: string): Promise<OrderEntity | undefined>;
  create(order: Omit<OrderEntity, "id" | "createdAt">): Promise<OrderEntity>;
}