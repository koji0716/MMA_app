import * as Local from "./local";
import { supabase } from "../supabase/client";

let cachedUserId: string | undefined;
let fetchingUserId: Promise<string | null> | null = null;

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

function logSupabaseAuthError(operation: string, error: unknown) {
  console.error(`Supabase auth ${operation} error`, error);
}

type LocalSession = Awaited<ReturnType<typeof Local.addSession>>;

function toRow(session: LocalSession, userId?: string | null) {
  return {
    id: session.id,
    date: session.date,
    start_time: session.startTime ?? null,
    type: session.type,
    duration_min: session.durationMin,
    tags: session.tags ?? [],
    memo: session.memo ?? null,
    ...(userId ? { user_id: userId } : {}),
  };
}

async function ensureSupabaseUserId() {
  if (!supabase) return null;
  if (cachedUserId) return cachedUserId;
  if (!fetchingUserId) {
    fetchingUserId = (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          logSupabaseAuthError("getSession", error);
        }
        const existingUserId = data.session?.user?.id ?? null;
        if (existingUserId) {
          cachedUserId = existingUserId;
          return existingUserId;
        }
        console.warn(
          "Supabase session is not available. Log in with your email address and password to enable syncing."
        );
        return null;
      } catch (error) {
        logSupabaseAuthError("ensureUser", error);
        return null;
      }
    })();
  }
  const userId = await fetchingUserId;
  fetchingUserId = null;
  if (!cachedUserId && userId) {
    cachedUserId = userId;
  }
  if (!userId) {
    cachedUserId = undefined;
  }
  return userId;
}

export async function addSession(input: unknown) {
  const record = await Local.addSession(input);
  if (!supabase) return record;
  try {
    const userId = await ensureSupabaseUserId();
    if (!userId) {
      console.warn(
        "Supabase addSession skipped because no authenticated user is available yet. Visit /auth to sign in before syncing."
      );
      return record;
    }
    const { error } = await supabase.from("sessions").upsert(toRow(record, userId), { onConflict: "id" });
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
    const userId = await ensureSupabaseUserId();
    if (!userId) {
      console.warn(
        "Supabase updateSession skipped because no authenticated user is available yet. Visit /auth to sign in before syncing."
      );
      return updated;
    }
    const { error } = await supabase.from("sessions").upsert(toRow(updated, userId), { onConflict: "id" });
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
    const userId = await ensureSupabaseUserId();
    if (!userId) {
      console.warn(
        "Supabase deleteSession skipped because no authenticated user is available yet. Visit /auth to sign in before syncing."
      );
      return;
    }
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
  const userId = await ensureSupabaseUserId();
  if (!userId) {
    console.warn(
      "Supabase retrySyncAll skipped because no authenticated user is available yet. Visit /auth to sign in before syncing."
    );
    return;
  }
  const pending = await Local.pendingSessions();
  for (const session of pending) {
    try {
      const { error } = await supabase
        .from("sessions")
        .upsert(toRow(session as LocalSession, userId), { onConflict: "id" });
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

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id ?? undefined;
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    retrySyncAll().catch((error) => console.error(error));
  });
}
