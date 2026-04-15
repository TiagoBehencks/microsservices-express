import { db } from "../db";
import { products } from "../domain/entities";
import { eq, sql } from "drizzle-orm";
import type { ProductRepository } from "./product-repository";

export class ProductRepositoryImpl implements ProductRepository {
  async findAll() {
    return await db.select().from(products);
  }

  async findById(productId: string) {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.productId, productId))
      .limit(1);
    return result[0];
  }

  async reduceStock(productId: string, quantity: number): Promise<boolean> {
    const product = await this.findById(productId);
    if (!product || product.quantity < quantity) {
      return false;
    }

    await db
      .update(products)
      .set({ quantity: sql`${products.quantity} - ${quantity}` })
      .where(eq(products.productId, productId));

    return true;
  }
}