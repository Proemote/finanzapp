"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { monthlySummaries, SIN_CUENTA, totals } from "@/lib/analytics";
import { classifyByRules, defaultCategory, UNCLASSIFIED } from "@/lib/categories";
import { exportMasterExcel } from "@/lib/export";
import {
  parseFile,
  parseWithMapping,
  readFileRows,
  type ManualMapping,
  type Row,
} from "@/lib/parse";
import {
  deleteAllTransactions,
  deleteTransaction,
  deleteTransactions,
  loadTransactions,
  saveTransactions,
} from "@/lib/supabase";
import type { Transaction } from "@/lib/types";

export type Status = {
  kind: "idle" | "working" | "error" | "warning" | "ok";
  message?: string;
  /** Si existe, el aviso muestra un botón "Deshacer" */
  undo?: () => void;
};

interface MapperState {
  rows: Row[];
  fileName: string;
  account: string;
}

export const ALL_ACCOUNTS = "__all__";

interface FinanzappContextValue {
  transactions: Transaction[];
  visible: Transaction[];
  accounts: string[];
  activeAccount: string;
  setActiveAccount: (account: string) => void;
  status: Status;
  setStatus: (status: Status) => void;
  query: string;
  setQuery: (query: string) => void;
  hasData: boolean;
  totalsVisible: ReturnType<typeof totals>;
  monthsVisible: ReturnType<typeof monthlySummaries>;

  pendingFiles: File[] | null;
  setPendingFiles: (files: File[] | null) => void;
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  editingTx: Transaction | null;
  setEditingTx: (tx: Transaction | null) => void;
  mapper: MapperState | null;
  setMapper: (mapper: MapperState | null) => void;

  handleFiles: (files: File[]) => void;
  processFiles: (files: File[], account: string) => Promise<void>;
  handleMapping: (mapping: ManualMapping) => Promise<void>;
  handleAddTransaction: (tx: Transaction) => void;
  handleUpdateTransaction: (tx: Transaction) => void;
  handleDeleteTransaction: (id: string) => void;
  handleDeleteTransactions: (ids: string[]) => void;
  handleCategoryChange: (id: string, category: string) => void;
  handleBulkCategoryChange: (ids: string[], category: string) => void;
  handleSave: () => Promise<void>;
  handleLoad: () => Promise<void>;
  handleExport: () => Promise<void>;
  handleClearAll: () => Promise<void>;
}

const FinanzappContext = createContext<FinanzappContextValue | null>(null);

export function FinanzappProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [query, setQuery] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [mapper, setMapper] = useState<MapperState | null>(null);
  const [activeAccount, setActiveAccount] = useState(ALL_ACCOUNTS);

  const accounts = useMemo(
    () => [...new Set(transactions.map((t) => t.account || SIN_CUENTA))].sort(),
    [transactions]
  );

  const visible = useMemo(
    () =>
      activeAccount === ALL_ACCOUNTS
        ? transactions
        : transactions.filter((t) => (t.account || SIN_CUENTA) === activeAccount),
    [transactions, activeAccount]
  );

  /** Paso 1: el usuario elige archivos → preguntamos la cuenta. */
  const handleFiles = useCallback((files: File[]) => {
    setPendingFiles(files);
  }, []);

  /** Clasifica con IA/reglas y fusiona en el estado (deduplicando por id). */
  const ingest = useCallback(
    async (parsed: Omit<Transaction, "category">[], skipped: number, account: string) => {
      try {
        setStatus({ kind: "working", message: `Clasificando ${parsed.length} movimientos con IA…` });

        let categories: Record<string, string> = {};
        let aiNote = "";
        let aiDegraded = false;
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
          // Ojo: lo que la IA no clasifica NO cae en reglas de nuevo, cae en
          // la categoría genérica "Otros ingresos/gastos" (ver defaultCategory
          // en /api/classify/route.ts). El aviso tiene que reflejar eso.
          if (data.aiError) {
            aiDegraded = true;
            aiNote = ` · ⚠️ IA no disponible (${data.aiError}): ${data.aiPending} movimiento(s) quedaron en "Otros", revísalos a mano`;
          } else if (!data.aiUsed && data.aiPending > 0) {
            aiDegraded = true;
            aiNote = ` · ⚠️ ${data.aiPending} movimiento(s) en "Otros" (añade GEMINI_API_KEY para clasificarlos con IA)`;
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
        setActiveAccount(ALL_ACCOUNTS);

        const { error: saveError } = await saveTransactions(classified);

        const skippedNote = skipped > 0 ? ` · ${skipped} filas omitidas` : "";
        const saveNote = saveError
          ? ` · ⚠️ no se pudo guardar en Supabase (${saveError}), pulsa "Guardar" o se perderá al recargar`
          : "";
        setStatus({
          kind: saveError ? "error" : aiDegraded ? "warning" : "ok",
          message: `${classified.length} movimientos importados en “${account}”${skippedNote}${aiNote}${saveNote}`,
        });
      } catch (err) {
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : "Error al procesar el archivo",
        });
      }
    },
    []
  );

  /** Paso 2: con la cuenta elegida, parsear los archivos y delegar en ingest. */
  const processFiles = useCallback(
    async (files: File[], account: string) => {
      setPendingFiles(null);
      setStatus({ kind: "working", message: "Leyendo archivo…" });
      try {
        const parsed: Omit<Transaction, "category">[] = [];
        let skipped = 0;
        for (const file of files) {
          const result = await parseFile(file);
          parsed.push(...result.transactions.map((t) => ({ ...t, account })));
          skipped += result.skippedRows;
        }

        if (parsed.length === 0) {
          if (files.length === 1) {
            const rows = await readFileRows(files[0]);
            if (rows.length > 0) {
              setMapper({ rows, fileName: files[0].name, account });
              setStatus({ kind: "idle" });
              return;
            }
          }
          setStatus({
            kind: "error",
            message:
              "No se han podido detectar movimientos en el archivo. Comprueba que tenga columnas de fecha, concepto e importe.",
          });
          return;
        }

        await ingest(parsed, skipped, account);
      } catch (err) {
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : "Error al procesar el archivo",
        });
      }
    },
    [ingest]
  );

  /** Confirmación del importador visual: parsear con el mapeo elegido. */
  const handleMapping = useCallback(
    async (mapping: ManualMapping) => {
      if (!mapper) return;
      const { rows, fileName, account } = mapper;
      setMapper(null);
      const result = parseWithMapping(rows, fileName, mapping);
      if (result.transactions.length === 0) {
        setStatus({
          kind: "error",
          message: "Con esas columnas no se ha podido interpretar ningún movimiento.",
        });
        return;
      }
      await ingest(
        result.transactions.map((t) => ({ ...t, account })),
        result.skippedRows,
        account
      );
    },
    [mapper, ingest]
  );

  const handleAddTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => [...prev, tx]);
    setShowAddModal(false);
    setStatus({
      kind: "ok",
      message: `Movimiento añadido: ${tx.description} (${tx.account})`,
    });
    void saveTransactions([tx]);
  }, []);

  const handleUpdateTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
    setEditingTx(null);
    setStatus({ kind: "ok", message: `Movimiento actualizado: ${tx.description}` });
    void saveTransactions([tx]);
  }, []);

  const handleDeleteTransaction = useCallback(
    (id: string) => {
      const tx = transactions.find((t) => t.id === id);
      if (!tx) return;
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      void deleteTransaction(id);
      setStatus({
        kind: "ok",
        message: `Movimiento eliminado: ${tx.description}`,
        undo: () => {
          setTransactions((prev) => [...prev, tx]);
          setStatus({
            kind: "ok",
            message: "Movimiento restaurado (pulsa Guardar para re-subirlo a Supabase)",
          });
        },
      });
    },
    [transactions]
  );

  const handleCategoryChange = useCallback((id: string, category: string) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, category } : t));
      const updated = next.find((t) => t.id === id);
      if (updated) void saveTransactions([updated]);
      return next;
    });
  }, []);

  /** Recategoriza varios movimientos a la vez (acción en lote de la tabla). */
  const handleBulkCategoryChange = useCallback((ids: string[], category: string) => {
    const idSet = new Set(ids);
    setTransactions((prev) => {
      const next = prev.map((t) => (idSet.has(t.id) ? { ...t, category } : t));
      const updated = next.filter((t) => idSet.has(t.id));
      if (updated.length > 0) void saveTransactions(updated);
      return next;
    });
    setStatus({
      kind: "ok",
      message: `${ids.length} movimientos recategorizados a "${category}"`,
    });
  }, []);

  /** Elimina varios movimientos a la vez (acción en lote de la tabla), con deshacer conjunto. */
  const handleDeleteTransactions = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      const removed = transactions.filter((t) => idSet.has(t.id));
      if (removed.length === 0) return;
      setTransactions((prev) => prev.filter((t) => !idSet.has(t.id)));
      void deleteTransactions(ids);
      setStatus({
        kind: "ok",
        message: `${removed.length} movimientos eliminados`,
        undo: () => {
          setTransactions((prev) => [...prev, ...removed]);
          setStatus({
            kind: "ok",
            message: "Movimientos restaurados (pulsa Guardar para re-subirlos a Supabase)",
          });
        },
      });
    },
    [transactions]
  );

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
    setActiveAccount(ALL_ACCOUNTS);
    setStatus({ kind: "ok", message: `${data?.length ?? 0} movimientos cargados de Supabase` });
  }, []);

  // Recupera automáticamente lo guardado en Supabase al abrir la app,
  // para que refrescar la página no borre lo ya importado.
  useEffect(() => {
    handleLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Borra todo (local + Supabase). Pensado para reimportar sin duplicados. */
  const handleClearAll = useCallback(async () => {
    setStatus({ kind: "working", message: "Vaciando todos los movimientos…" });
    const { error } = await deleteAllTransactions();
    if (error) {
      setStatus({ kind: "error", message: `Error al vaciar: ${error}` });
      return;
    }
    setTransactions([]);
    setActiveAccount(ALL_ACCOUNTS);
    setStatus({ kind: "ok", message: "Todos los movimientos han sido eliminados" });
  }, []);

  const handleExport = useCallback(async () => {
    setStatus({ kind: "working", message: "Generando Excel…" });
    try {
      const accountLabel = activeAccount === ALL_ACCOUNTS ? undefined : activeAccount;
      await exportMasterExcel(visible, accountLabel);
      setStatus({ kind: "ok", message: "Excel generado y descargado" });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Error al generar el Excel",
      });
    }
  }, [visible, activeAccount]);

  const totalsVisible = totals(visible);
  const monthsVisible = monthlySummaries(visible);
  const hasData = transactions.length > 0;

  const value: FinanzappContextValue = {
    transactions,
    visible,
    accounts,
    activeAccount,
    setActiveAccount,
    status,
    setStatus,
    query,
    setQuery,
    hasData,
    totalsVisible,
    monthsVisible,
    pendingFiles,
    setPendingFiles,
    showAddModal,
    setShowAddModal,
    editingTx,
    setEditingTx,
    mapper,
    setMapper,
    handleFiles,
    processFiles,
    handleMapping,
    handleAddTransaction,
    handleUpdateTransaction,
    handleDeleteTransaction,
    handleDeleteTransactions,
    handleCategoryChange,
    handleBulkCategoryChange,
    handleSave,
    handleLoad,
    handleExport,
    handleClearAll,
  };

  return <FinanzappContext.Provider value={value}>{children}</FinanzappContext.Provider>;
}

export function useFinanzapp(): FinanzappContextValue {
  const ctx = useContext(FinanzappContext);
  if (!ctx) throw new Error("useFinanzapp debe usarse dentro de <FinanzappProvider>");
  return ctx;
}
