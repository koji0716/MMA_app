import * as Local from "./local";
import * as Supabase from "./supabase";

const mode = process.env.NEXT_PUBLIC_MODE;

export const DS = mode === "supabase" ? Supabase : Local;
