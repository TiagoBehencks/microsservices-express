import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const protoPath = './proto/products.proto';
const PRODUCT_GRPC_HOST = process.env.PRODUCT_SERVICE_URL || 'product-service:4001';

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition) as any;
const client = new proto.ecommerce.ProductService(
  PRODUCT_GRPC_HOST,
  grpc.credentials.createInsecure()
);

export async function getProduct(productId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    client.getProduct({ productId }, (err: any, response: any) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

export async function checkStock(productId: string, quantity: number): Promise<{ available: boolean; availableQuantity: number }> {
  return new Promise((resolve, reject) => {
    client.checkStock({ productId, quantity }, (err: any, response: any) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

export async function reduceStock(productId: string, quantity: number): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve, reject) => {
    client.reduceStock({ productId, quantity }, (err: any, response: any) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}