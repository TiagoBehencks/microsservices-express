import type { ProductEntity } from "../entities";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
}

export function toProduct(entity: ProductEntity): Product {
  return {
    id: entity.productId,
    name: entity.name,
    description: entity.description,
    price: Number(entity.price),
    quantity: entity.quantity,
    category: entity.category,
  };
}

export function toProductList(entities: ProductEntity[]): Product[] {
  return entities.map(toProduct);
}