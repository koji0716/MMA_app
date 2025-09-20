import { createClient } from "@supabase/supabase-js";
import * as Local from "./local";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = typeof window !== "undefined" && url && anonKey ? createClient(url, anonKey) : null;

type LocalSession = Awaited<ReturnType<typeof Local.addSession>>;

function toRow(session: LocalSession) {
  return {
    id: session.id,
    date: session.date,
    start_time: session.startTime ?? null,
    type: session.type,
    duration_min: session.durationMin,
    tags: session.tags ?? [],
    memo: session.memo ?? null,
  };
}

export async function addSession(input: unknown) {
  const record = await Local.addSession(input);
  if (!supabase) return record;
  try {
    const { error } = await supabase.from("sessions").upsert(toRow(record), { onConflict: "id" });
    if (error) {
      console.error("Supabase addSession error", error);
      return record;
    }
    await Local.markSynced(record.id);
  } catch (error) {
    console.error("Supabase addSession error", error);
  }
  return record;
}

export async function listSessions(params?: { from?: string; to?: string }) {
  return Local.listSessions(params);
}

export async function getSession(id: string) {
  return Local.getSession(id);
}

export async function updateSession(id: string, patch: Partial<LocalSession>) {
  const updated = await Local.updateSession(id, patch as any);
  if (!updated || !supabase) return updated;
  try {
    const { error } = await supabase.from("sessions").upsert(toRow(updated), { onConflict: "id" });
    if (error) {
      console.error("Supabase updateSession error", error);
      return updated;
    }
    await Local.markSynced(id);
  } catch (error) {
    console.error("Supabase updateSession error", error);
  }
  return updated;
}

export async function deleteSession(id: string) {
  await Local.deleteSession(id);
  if (!supabase) return;
  try {
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) {
      console.error("Supabase deleteSession error", error);
    }
  } catch (error) {
    console.error("Supabase deleteSession error", error);
  }
}

export async function retrySyncAll() {
  if (!supabase) return;
  const pending = await Local.pendingSessions();
  for (const session of pending) {
    try {
      const { error } = await supabase.from("sessions").upsert(toRow(session as LocalSession), { onConflict: "id" });
      if (error) {
        console.error("Supabase retrySync error", error);
        continue;
      }
      await Local.markSynced(session.id);
    } catch (error) {
      console.error("Supabase retrySync error", error);
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    retrySyncAll().catch((error) => console.error(error));
  });
}
