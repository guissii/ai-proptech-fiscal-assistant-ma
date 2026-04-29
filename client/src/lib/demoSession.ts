import { nanoid } from "nanoid";

export function getDemoSessionId(): string {
  const key = "aqar.demo.sessionId";
  if (typeof window === "undefined") {
    return "server";
  }
  const existing = window.localStorage.getItem(key);
  if (existing && existing.length >= 8) return existing;
  const created = nanoid();
  window.localStorage.setItem(key, created);
  return created;
}

