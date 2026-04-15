import { Elysia } from "elysia";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import { connectDatabase } from "./db";
import { migrate } from "./migrate";
import { createProductGrpcServiceHandlers } from "./adapters/grpc-handlers";
import { ProductRepositoryImpl } from "./infrastructure/product-repository-impl";

const PRODUCT_HTTP_PORT = 3001;
const PRODUCT_GRPC_PORT = 4001;

async function startGrpcServer(handlers: any) {
  const protoPath = "./proto/products.proto";
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const proto = grpc.loadPackageDefinition(packageDefinition) as any;
  const server = new grpc.Server();
  server.addService(proto.ecommerce.ProductService.service, handlers);

  return new Promise<void>((resolve, reject) => {
    server.bindAsync(
      `0.0.0.0:${PRODUCT_GRPC_PORT}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          reject(err);
          return;
        }
        server.start();
        console.log(`📦 Product Service gRPC server running on port ${port}`);
        resolve();
      }
    );
  });
}

async function startHttpServer(productRepository: ProductRepositoryImpl) {
  const { ListProductsUseCase, GetProductUseCase } = await import("./application/usecases/product-usecases");

  const listProductsUseCase = new ListProductsUseCase(productRepository);
  const getProductUseCase = new GetProductUseCase(productRepository);

  return new Elysia()
    .get("/", () => ({
      service: "product-service",
      status: "running",
      timestamp: new Date().toISOString(),
    }))
    .get("/products", async () => await listProductsUseCase.execute())
    .get("/products/:id", async ({ params }) => {
      const product = await getProductUseCase.execute(params.id);
      if (!product) {
        return { error: "Product not found", status: 404 };
      }
      return product;
    })
    .listen(PRODUCT_HTTP_PORT);
}

async function main() {
  console.log("\n🛒 Starting Product Service...\n");

  await connectDatabase();
  await migrate();

  const productRepository = new ProductRepositoryImpl();
  const grpcHandlers = createProductGrpcServiceHandlers(productRepository);

  await Promise.all([
    startGrpcServer(grpcHandlers),
    startHttpServer(productRepository),
  ]);

  console.log(`📦 Product Service HTTP running on http://localhost:${PRODUCT_HTTP_PORT}`);
  console.log("✅ Product Service fully operational!\n");
}

main().catch(console.error);