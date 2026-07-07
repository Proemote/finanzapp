"use client";

import { useCallback, useRef, useState } from "react";
import {
  CloudDownload,
  CloudUpload,
  Download,
  Loader2,
  Search,
  Upload,
  Wallet,
} from "lucide-react";
import ChartsPanel from "@/components/ChartsPanel";
import Sidebar from "@/components/Sidebar";
import SummaryCards from "@/components/SummaryCards";
import TransactionsTable from "@/components/TransactionsTable";
import UploadZone from "@/components/UploadZone";
import { monthlySummaries, totals } from "@/lib/analytics";
import { classifyByRules, defaultCategory, UNCLASSIFIED } from "@/lib/categories";
import { exportMasterExcel } from "@/lib/export";
import { parseFile } from "@/lib/parse";
import { loadTransactions, saveTransactions } from "@/lib/supabase";
import type { Transaction } from "@/lib/types";

type Status = { kind: "idle" | "working" | "error" | "ok"; message?: string };

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [query, setQuery] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    setStatus({ kind: "working", message: "Leyendo archivo…" });
    try {
      const parsed: Omit<Transaction, "category">[] = [];
      let skipped = 0;
      for (const file of files) {
        const result = await parseFile(file);
        parsed.push(...result.transactions);
        skipped += result.skippedRows;
      }

      if (parsed.length === 0) {
        setStatus({
          kind: "error",
          message:
            "No se han podido detectar movimientos en el archivo. Comprueba que tenga columnas de fecha, concepto e importe.",
        });
        return;
      }

      setStatus({ kind: "working", message: `Clasificando ${parsed.length} movimientos con IA…` });

      let categories: Record<string, string> = {};
      let aiNote = "";
      try {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactions: parsed.map((t) => ({
              id: t.id,
              description: t.description,
              amount: t.amount,
            })),
          }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        categories = data.categories ?? {};
        if (!data.aiUsed) {
          aiNote = data.aiError
            ? ` (IA no disponible: ${data.aiError}; clasificación por reglas)`
            : " (clasificado por reglas; añade GEMINI_API_KEY para usar IA)";
        }
      } catch {
        for (const t of parsed) {
          const c = classifyByRules(t.description, t.amount);
          categories[t.id] = c === UNCLASSIFIED ? defaultCategory(t.amount) : c;
        }
        aiNote = " (clasificado por reglas, sin conexión con la API)";
      }

      const classified: Transaction[] = parsed.map((t) => ({
        ...t,
        category: categories[t.id] ?? defaultCategory(t.amount),
      }));

      setTransactions((prev) => {
        const existing = new Set(prev.map((t) => t.id));
        return [...prev, ...classified.filter((t) => !existing.has(t.id))];
      });

      const skippedNote = skipped > 0 ? ` · ${skipped} filas omitidas` : "";
      setStatus({
        kind: "ok",
        message: `${classified.length} movimientos importados${skippedNote}${aiNote}`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Error al procesar el archivo",
      });
    }
  }, []);

  const handleCategoryChange = useCallback((id: string, category: string) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, category } : t)));
  }, []);

  const handleSave = useCallback(async () => {
    setStatus({ kind: "working", message: "Guardando en Supabase…" });
    const { error } = await saveTransactions(transactions);
    setStatus(
      error
        ? { kind: "error", message: `Error al guardar: ${error}` }
        : { kind: "ok", message: `${transactions.length} movimientos guardados en Supabase` }
    );
  }, [transactions]);

  const handleLoad = useCallback(async () => {
    setStatus({ kind: "working", message: "Cargando desde Supabase…" });
    const { data, error } = await loadTransactions();
    if (error) {
      setStatus({ kind: "error", message: `Error al cargar: ${error}` });
      return;
    }
    setTransactions(data ?? []);
    setStatus({ kind: "ok", message: `${data?.length ?? 0} movimientos cargados de Supabase` });
  }, []);

  const t = totals(transactions);
  const months = monthlySummaries(transactions);
  const hasData = transactions.length > 0;

  const actionBtn =
    "inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-secondary transition-colors duration-150 hover:border-line-strong hover:text-foreground";

  return (
    <div className="flex min-h-dvh">
      <Sidebar hasData={hasData} />

      <div className="min-w-0 flex-1">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-line bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-deep">
                <Wallet className="h-4 w-4 text-white" aria-hidden />
              </span>
              <span className="font-bold">Finanzapp</span>
            </div>

            <label className="relative hidden max-w-md flex-1 items-center sm:flex">
              <Search
                className="pointer-events-none absolute left-3 h-4 w-4 text-muted"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar movimientos, categorías…"
                aria-label="Buscar movimientos"
                className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-4 text-sm outline-none transition-colors duration-150 placeholder:text-muted focus:border-violet"
              />
            </label>

            <div className="ml-auto flex items-center gap-2">
              <input
                ref={importRef}
                type="file"
                accept=".csv,.xls,.xlsx,.txt"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(Array.from(e.target.files));
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => importRef.current?.click()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-violet-deep px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
              >
                <Upload className="h-4 w-4" aria-hidden />
                Importar CSV
              </button>
            </div>
          </div>
        </header>

        <main id="dashboard" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
              <p className="mt-1 text-sm text-secondary">Bienvenido a tu panorama financiero.</p>
            </div>
            {hasData && (
              <div className="flex flex-wrap gap-2">
                <button onClick={handleLoad} className={actionBtn}>
                  <CloudDownload className="h-4 w-4" aria-hidden />
                  Cargar
                </button>
                <button onClick={handleSave} className={actionBtn}>
                  <CloudUpload className="h-4 w-4" aria-hidden />
                  Guardar
                </button>
                <button
                  onClick={() => exportMasterExcel(transactions)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#131118] transition-opacity duration-150 hover:opacity-85"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Exportar Excel
                </button>
              </div>
            )}
          </div>

          {status.kind !== "idle" && status.message && (
            <div
              role="status"
              className={`mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                status.kind === "error"
                  ? "border-bad/30 bg-bad/10 text-bad"
                  : status.kind === "working"
                  ? "border-line bg-surface text-secondary"
                  : "border-good/30 bg-good/10 text-good"
              }`}
            >
              {status.kind === "working" && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              {status.message}
            </div>
          )}

          {!hasData ? (
            <div className="space-y-5">
              <UploadZone onFiles={handleFiles} />
              <p className="text-center">
                <button
                  onClick={handleLoad}
                  className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium text-violet transition-colors duration-150 hover:bg-violet/10"
                >
                  …o cargar movimientos guardados en Supabase
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <SummaryCards balance={t.balance} months={months} />
              <ChartsPanel transactions={transactions} />
              <TransactionsTable
                transactions={transactions}
                query={query}
                onCategoryChange={handleCategoryChange}
              />
              <UploadZone onFiles={handleFiles} compact />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
