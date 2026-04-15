import { db } from './db';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL UNIQUE,
  product_id VARCHAR(50) NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  customer_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

export async function migrate() {
  await db.execute(CREATE_TABLE_SQL);
  console.log('🗄️  Migration completed: orders table created');
}
