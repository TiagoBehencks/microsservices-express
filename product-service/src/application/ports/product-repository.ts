import type { ProductEntity } from "../entities";

export interface ProductRepository {
  findAll(): Promise<ProductEntity[]>;
  findById(productId: string): Promise<ProductEntity | undefined>;
  reduceStock(productId: string, quantity: number): Promise<boolean>;
}