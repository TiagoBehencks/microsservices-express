import { db } from './db';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

export async function migrate() {
  await db.execute(CREATE_TABLE_SQL);
  console.log('🗄️  Migration completed: products table created');
}