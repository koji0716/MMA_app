import { createClient } from "@supabase/supabase-js";
import * as Local from "./local";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = typeof window !== "undefined" && url && anonKey ? createClient(url, anonKey) : null;

type PostgrestError = {
  code: string | null;
  details: string | null;
  hint: string | null;
  message: string;
};

function logSupabaseError(operation: string, error: unknown) {
  const baseLabel = `Supabase ${operation} error`;
  if (error && typeof error === "object" && "code" in error) {
    const typed = error as PostgrestError;
    console.error(baseLabel, typed);
    if (typed.code === "PGRST205") {
      console.error(
        "The sessions table is missing in Supabase. Run the setup SQL from the README to create public.sessions before retrying."
      );
    }
  } else {
    console.error(baseLabel, error);
  }
}

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
      logSupabaseError("addSession", error);
      return record;
    }
    await Local.markSynced(record.id);
  } catch (error) {
    logSupabaseError("addSession", error);
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
      logSupabaseError("updateSession", error);
      return updated;
    }
    await Local.markSynced(id);
  } catch (error) {
    logSupabaseError("updateSession", error);
  }
  return updated;
}

export async function deleteSession(id: string) {
  await Local.deleteSession(id);
  if (!supabase) return;
  try {
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) {
      logSupabaseError("deleteSession", error);
    }
  } catch (error) {
    logSupabaseError("deleteSession", error);
  }
}

export async function retrySyncAll() {
  if (!supabase) return;
  const pending = await Local.pendingSessions();
  for (const session of pending) {
    try {
      const { error } = await supabase.from("sessions").upsert(toRow(session as LocalSession), { onConflict: "id" });
      if (error) {
        logSupabaseError("retrySync", error);
        continue;
      }
      await Local.markSynced(session.id);
    } catch (error) {
      logSupabaseError("retrySync", error);
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    retrySyncAll().catch((error) => console.error(error));
  });
}
