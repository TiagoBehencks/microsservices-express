import { GetProductUseCase, ListProductsUseCase, CheckStockUseCase, ReduceStockUseCase } from "../application/usecases/product-usecases";
import type { ProductRepository } from "../application/ports/product-repository";
import type { ServerUnaryCall } from "@grpc/grpc-js";
import * as grpc from "@grpc/grpc-js";

export function createProductGrpcServiceHandlers(productRepository: ProductRepository) {
  const getProductUseCase = new GetProductUseCase(productRepository);
  const listProductsUseCase = new ListProductsUseCase(productRepository);
  const checkStockUseCase = new CheckStockUseCase(productRepository);
  const reduceStockUseCase = new ReduceStockUseCase(productRepository);

  return {
    getProduct: async (call: ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
      const { productId } = call.request;
      const product = await getProductUseCase.execute(productId);

      if (!product) {
        return callback(
          { code: grpc.status.NOT_FOUND, message: "Product not found" },
          null
        );
      }

      callback(null, {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        category: product.category,
      });
    },

    listProducts: async (_call: ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
      const productsList = await listProductsUseCase.execute();
      const productResponses = productsList.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        quantity: p.quantity,
        category: p.category,
      }));

      callback(null, { products: productResponses });
    },

    checkStock: async (call: ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
      const { productId, quantity } = call.request;
      const result = await checkStockUseCase.execute(productId, quantity);

      callback(null, {
        available: result.available,
        availableQuantity: result.availableQuantity,
      });
    },

    reduceStock: async (call: ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
      const { productId, quantity } = call.request;
      const success = await reduceStockUseCase.execute(productId, quantity);

      if (!success) {
        return callback(
          {
            code: grpc.status.FAILED_PRECONDITION,
            message: "Insufficient stock or product not found",
          },
          null
        );
      }

      callback(null, { success: true, message: "Stock reduced successfully" });
    },
  };
}