import { nanoid } from "nanoid";
import path from "path";
import fs from "fs/promises";

export type DemoMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
};

export type DemoConversation = {
  id: string;
  sessionId: string;
  city: "fes" | "rabat" | "casa";
  language: "fr" | "ar" | "en";
  currentNodeId: string;
  answers: Record<string, string | number>;
  messages: DemoMessage[];
  createdAt: number;
  updatedAt: number;
};

type DemoDb = {
  conversations: Record<string, DemoConversation>;
};

const STORAGE_DIR = path.join(process.cwd(), "storage");
const DB_PATH = path.join(STORAGE_DIR, "demo-db.json");

let writeChain: Promise<void> = Promise.resolve();

async function ensureStorageDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

async function loadDb(): Promise<DemoDb> {
  await ensureStorageDir();
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw) as DemoDb;
    if (!parsed.conversations || typeof parsed.conversations !== "object") {
      return { conversations: {} };
    }
    return parsed;
  } catch {
    return { conversations: {} };
  }
}

async function saveDb(db: DemoDb): Promise<void> {
  await ensureStorageDir();
  const tmpPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(db, null, 2), "utf-8");
  await fs.rename(tmpPath, DB_PATH);
}

async function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  let resolveNext: () => void;
  const next = new Promise<void>(resolve => {
    resolveNext = resolve;
  });
  const prev = writeChain;
  writeChain = prev.then(() => next);
  await prev;
  try {
    return await fn();
  } finally {
    resolveNext!();
  }
}

export async function demoCreateConversation(input: {
  sessionId: string;
  city: "fes" | "rabat" | "casa";
  language: "fr" | "ar" | "en";
  startNodeId: string;
}): Promise<DemoConversation> {
  return withWriteLock(async () => {
    const db = await loadDb();
    const now = Date.now();
    const conversation: DemoConversation = {
      id: nanoid(),
      sessionId: input.sessionId,
      city: input.city,
      language: input.language,
      currentNodeId: input.startNodeId,
      answers: {},
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    db.conversations[conversation.id] = conversation;
    await saveDb(db);
    return conversation;
  });
}

export async function demoGetConversation(
  conversationId: string
): Promise<DemoConversation | null> {
  const db = await loadDb();
  return db.conversations[conversationId] ?? null;
}

export async function demoUpdateConversation(
  conversationId: string,
  update: (c: DemoConversation) => DemoConversation
): Promise<DemoConversation | null> {
  return withWriteLock(async () => {
    const db = await loadDb();
    const current = db.conversations[conversationId];
    if (!current) return null;
    const next = update(current);
    db.conversations[conversationId] = next;
    await saveDb(db);
    return next;
  });
}

export function demoAddMessage(
  conversation: DemoConversation,
  role: DemoMessage["role"],
  content: string
): DemoConversation {
  const now = Date.now();
  const msg: DemoMessage = {
    id: nanoid(),
    role,
    content,
    ts: now,
  };
  return {
    ...conversation,
    messages: [...conversation.messages, msg],
    updatedAt: now,
  };
}

