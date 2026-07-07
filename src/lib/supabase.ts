import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Transaction } from "./types";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}

/** Guarda los movimientos en Supabase (upsert por id, no duplica). */
export async function saveTransactions(transactions: Transaction[]): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase no está configurado (.env.local)" };

  const rows = transactions.map((t) => ({
    id: t.id,
    date: t.date,
    description: t.description,
    amount: t.amount,
    category: t.category,
    account: t.account,
    source: t.source,
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
