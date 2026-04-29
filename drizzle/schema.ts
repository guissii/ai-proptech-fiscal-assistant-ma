import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Conversations table - stores chat sessions
 */
export const conversations = mysqlTable("conversations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  city: mysqlEnum("city", ["fes", "rabat", "casa"]).default("rabat").notNull(),
  language: mysqlEnum("language", ["fr", "ar", "en"]).default("fr").notNull(),
  title: text("title"),
  flowType: varchar("flowType", { length: 64 }), // achat, vente, location, airbnb, detention
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table - stores chat messages
 */
export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  conversationId: varchar("conversationId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"), // Store extracted entities, simulation data, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Simulations table - stores simulation results
 */
export const simulations = mysqlTable("simulations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  conversationId: varchar("conversationId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["achat", "location", "airbnb", "detention", "tpi"]).notNull(),
  city: mysqlEnum("city", ["fes", "rabat", "casa"]).notNull(),
  quartier: varchar("quartier", { length: 255 }),
  inputData: json("inputData").notNull(), // Store all input parameters
  results: json("results").notNull(), // Store calculation results
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = typeof simulations.$inferInsert;
