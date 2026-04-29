import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, conversations, messages, simulations, Conversation, Message, Simulation } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ CONVERSATIONS ============

export async function createConversation(data: {
  id: string;
  userId: number;
  city: 'fes' | 'rabat' | 'casa';
  language: 'fr' | 'ar' | 'en';
  title?: string;
  flowType?: string;
}): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(conversations).values(data);
  const result = await db.select().from(conversations).where(eq(conversations.id, data.id)).limit(1);
  return result[0];
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0];
}

export async function getUserConversations(userId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function updateConversation(id: string, data: Partial<Conversation>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

// ============ MESSAGES ============

export async function createMessage(data: {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(messages).values(data);
  const result = await db.select().from(messages).where(eq(messages.id, data.id)).limit(1);
  return result[0];
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(messages).where(eq(messages.conversationId, conversationId));
}

// ============ SIMULATIONS ============

export async function createSimulation(data: {
  id: string;
  conversationId: string;
  userId: number;
  type: 'achat' | 'location' | 'airbnb' | 'detention' | 'tpi';
  city: 'fes' | 'rabat' | 'casa';
  quartier?: string;
  inputData: Record<string, unknown>;
  results: Record<string, unknown>;
}): Promise<Simulation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(simulations).values(data);
  const result = await db.select().from(simulations).where(eq(simulations.id, data.id)).limit(1);
  return result[0];
}

export async function getUserSimulations(userId: number): Promise<Simulation[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(simulations).where(eq(simulations.userId, userId)).orderBy(desc(simulations.createdAt));
}

export async function getConversationSimulations(conversationId: string): Promise<Simulation[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(simulations).where(eq(simulations.conversationId, conversationId));
}
