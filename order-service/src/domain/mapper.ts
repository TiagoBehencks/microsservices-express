import type { OrderEntity } from "../entities";

export interface Order {
  id: number;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: string;
  status: string;
  customerEmail: string;
  createdAt: string;
}

export function toOrder(entity: OrderEntity): Order {
  return {
    id: entity.id,
    orderId: entity.orderId,
    productId: entity.productId,
    productName: entity.productName,
    quantity: entity.quantity,
    totalPrice: entity.totalPrice,
    status: entity.status,
    customerEmail: entity.customerEmail,
    createdAt: entity.createdAt?.toString() || new Date().toISOString(),
  };
}

export function toOrderList(entities: OrderEntity[]): Order[] {
  return entities.map(toOrder);
}