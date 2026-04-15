import type { Product } from "../../domain/mapper";
import { toProduct } from "../../domain/mapper";
import type { ProductRepository } from "../ports/product-repository";

export class GetProductUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(productId: string): Promise<Product | null> {
    const entity = await this.productRepository.findById(productId);
    return entity ? toProduct(entity) : null;
  }
}

export class ListProductsUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(): Promise<Product[]> {
    const entities = await this.productRepository.findAll();
    return entities.map(toProduct);
  }
}

export class CheckStockUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(productId: string, quantity: number) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      return { available: false, availableQuantity: 0 };
    }
    return {
      available: product.quantity >= quantity,
      availableQuantity: product.quantity,
    };
  }
}

export class ReduceStockUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(productId: string, quantity: number): Promise<boolean> {
    return this.productRepository.reduceStock(productId, quantity);
  }
}