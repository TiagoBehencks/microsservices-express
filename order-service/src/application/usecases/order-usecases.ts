import type { Order } from "../domain/mapper";
import type { OrderRepository } from "../application/ports/order-repository";

export class CreateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private getProduct: (productId: string) => Promise<any>,
    private checkStock: (productId: string, quantity: number) => Promise<any>,
    private reduceStock: (productId: string, quantity: number) => Promise<any>,
    private publishEvent: (event: any) => Promise<void>
  ) {}

  async execute(
    productId: string,
    quantity: number,
    customerEmail: string
  ): Promise<{ order?: Order; error?: string }> {
    try {
      const product = await this.getProduct(productId);

      if (!product) {
        return { error: "Product not found" };
      }

      const stockCheck = await this.checkStock(productId, quantity);

      if (!stockCheck.available) {
        return {
          error: `Insufficient stock. Available: ${stockCheck.availableQuantity}`,
        };
      }

      const totalPrice = Number(product.price) * quantity;

      const order = await this.orderRepository.create({
        orderId: `order_${Date.now()}`,
        productId,
        productName: product.name,
        quantity,
        totalPrice: String(totalPrice),
        status: "confirmed",
        customerEmail,
      });

      await this.reduceStock(productId, quantity);

      await this.publishEvent({
        orderId: order.orderId,
        productId: order.productId,
        productName: order.productName,
        quantity: Number(order.quantity),
        totalPrice: Number(order.totalPrice),
        customerEmail: order.customerEmail,
        createdAt: new Date(order.createdAt).toISOString(),
      });

      return { order: { ...order, createdAt: order.createdAt?.toString() } };
    } catch (err: any) {
      return { error: err.message || "Failed to create order" };
    }
  }
}

export class ListOrdersUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(): Promise<Order[]> {
    const ordersList = await this.orderRepository.findAll();
    return ordersList.map((o) => ({
      ...o,
      createdAt: o.createdAt?.toString(),
    }));
  }
}

export class GetOrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(orderId: string): Promise<Order | null> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return null;
    return { ...order, createdAt: order.createdAt?.toString() };
  }
}