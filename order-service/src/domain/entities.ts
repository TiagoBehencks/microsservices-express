import { pgTable, serial, text, integer, numeric, timestamp, varchar } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id", { length: 50 }).notNull().unique(),
  productId: varchar("product_id", { length: 50 }).notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("confirmed"),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type OrderEntity = typeof orders.$inferSelect;
export type NewOrderEntity = typeof orders.$inferInsert;