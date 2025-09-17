import { get, set } from "idb-keyval";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import { zSessionQuick } from "@/lib/schema/zod";

export type SyncState = "pending" | "synced" | "error";

const KEY_SESSIONS = "sessions";

type SessionRecord = {
  id: string;
  createdAt: string;
  syncState: SyncState;
  date: string;
  startTime?: string;
  type: string;
  durationMin: number;
  tags: string[];
  memo?: string;
};

function assertClient() {
  if (typeof window === "undefined") {
    throw new Error("local datastore is only available in the browser");
  }
}

export async function addSession(input: unknown) {
  assertClient();
  const parsed = zSessionQuick.parse(input);
  const record: SessionRecord = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    syncState: "pending",
    ...parsed,
    tags: parsed.tags ?? [],
  };
  const list: SessionRecord[] = ((await get(KEY_SESSIONS)) as SessionRecord[] | undefined) ?? [];
  list.push(record);
  await set(KEY_SESSIONS, list);
  return record;
}

export async function listSessions(params?: { from?: string; to?: string }) {
  assertClient();
  const list: SessionRecord[] = ((await get(KEY_SESSIONS)) as SessionRecord[] | undefined) ?? [];
  if (!params) return list;
  const from = params.from ? dayjs(params.from) : null;
  const to = params.to ? dayjs(params.to) : null;
  return list.filter((session) => {
    const date = dayjs(session.date);
    if (from && date.isBefore(from)) return false;
    if (to && date.isAfter(to)) return false;
    return true;
  });
}

export async function updateSession(id: string, patch: Partial<SessionRecord>) {
  assertClient();
  const list: SessionRecord[] = ((await get(KEY_SESSIONS)) as SessionRecord[] | undefined) ?? [];
  const index = list.findIndex((session) => session.id === id);
  if (index === -1) return null;
  list[index] = { ...list[index], ...patch, syncState: "pending" };
  await set(KEY_SESSIONS, list);
  return list[index];
}

export async function deleteSession(id: string) {
  assertClient();
  const list: SessionRecord[] = ((await get(KEY_SESSIONS)) as SessionRecord[] | undefined) ?? [];
  const next = list.filter((session) => session.id !== id);
  await set(KEY_SESSIONS, next);
}

export async function markSynced(id: string) {
  assertClient();
  const list: SessionRecord[] = ((await get(KEY_SESSIONS)) as SessionRecord[] | undefined) ?? [];
  const index = list.findIndex((session) => session.id === id);
  if (index >= 0) {
    list[index].syncState = "synced";
    await set(KEY_SESSIONS, list);
  }
}

export async function pendingSessions() {
  assertClient();
  const list: SessionRecord[] = ((await get(KEY_SESSIONS)) as SessionRecord[] | undefined) ?? [];
  return list.filter((session) => session.syncState === "pending");
}
