import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase-browser";
import type { Transaction } from "./types";

let client: SupabaseClient | null = null;

/**
 * Cliente con sesión (cookies del login) — imprescindible para que las
 * políticas RLS por user_id sepan quién está preguntando. Antes se usaba un
 * cliente anónimo sin sesión, lo que dejaba la tabla efectivamente abierta.
 */
export function getSupabase(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  if (!client) client = createClient();
  return client;
}

/** Guarda los movimientos en Supabase (upsert por id, no duplica). */
export async function saveTransactions(transactions: Transaction[]): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase no está configurado (.env.local)" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No hay sesión activa" };

  const rows = transactions.map((t) => ({
    id: t.id,
    date: t.date,
    description: t.description,
    amount: t.amount,
    category: t.category,
    account: t.account,
    source: t.source,
    user_id: user.id,
  }));

  const { error } = await supabase.from("transactions_mvp").upsert(rows, { onConflict: "id" });
  return error ? { error: error.message } : {};
}

/** Elimina un movimiento de Supabase (si no existe allí, no pasa nada). */
export async function deleteTransaction(id: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return {};
  const { error } = await supabase.from("transactions_mvp").delete().eq("id", id);
  return error ? { error: error.message } : {};
}

/** Elimina varios movimientos de Supabase de una vez (acciones en lote). */
export async function deleteTransactions(ids: string[]): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return {};
  const { error } = await supabase.from("transactions_mvp").delete().in("id", ids);
  return error ? { error: error.message } : {};
}

/** Borra TODOS los movimientos de Supabase. Usar antes de reimportar para evitar duplicados. */
export async function deleteAllTransactions(): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase no está configurado (.env.local)" };
  const { error } = await supabase.from("transactions_mvp").delete().not("id", "is", null);
  return error ? { error: error.message } : {};
}

/** Carga todos los movimientos guardados en Supabase. */
export async function loadTransactions(): Promise<{ data?: Transaction[]; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase no está configurado (.env.local)" };

  const { data, error } = await supabase
    .from("transactions_mvp")
    .select("id, date, description, amount, category, account, source")
    .order("date", { ascending: true });

  if (error) return { error: error.message };
  const normalized = (data ?? []).map((r) => ({ ...r, account: r.account ?? "" }));
  return { data: normalized as Transaction[] };
}
