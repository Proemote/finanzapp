"use client";

import { CloudDownload, CloudUpload, Download, Loader2, Plus } from "lucide-react";
import { ALL_ACCOUNTS, useFinanzapp } from "@/context/finanzapp-context";
import { SIN_CUENTA } from "@/lib/analytics";

const actionBtn =
  "inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-secondary transition-colors duration-150 hover:border-line-strong hover:text-foreground";

export default function ControlBar() {
  const {
    hasData,
    accounts,
    activeAccount,
    setActiveAccount,
    status,
    setShowAddModal,
    handleLoad,
    handleSave,
    handleExport,
  } = useFinanzapp();

  if (!hasData && status.kind === "idle") return null;

  return (
    <div className="mb-6 space-y-4">
      {hasData && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {accounts.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por cuenta">
              {[ALL_ACCOUNTS, ...accounts].map((a) => (
                <button
                  key={a}
                  onClick={() => setActiveAccount(a)}
                  aria-pressed={activeAccount === a}
                  className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
                    activeAccount === a
                      ? "bg-violet-deep text-white"
                      : "border border-line text-secondary hover:border-line-strong hover:text-foreground"
                  }`}
                >
                  {a === ALL_ACCOUNTS ? "Todas las cuentas" : a === SIN_CUENTA ? "Sin cuenta" : a}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowAddModal(true)} className={actionBtn}>
              <Plus className="h-4 w-4" aria-hidden />
              Añadir
            </button>
            <button onClick={handleLoad} className={actionBtn}>
              <CloudDownload className="h-4 w-4" aria-hidden />
              Cargar
            </button>
            <button onClick={handleSave} className={actionBtn}>
              <CloudUpload className="h-4 w-4" aria-hidden />
              Guardar
            </button>
            <button
              onClick={handleExport}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-violet-deep px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            >
              <Download className="h-4 w-4" aria-hidden />
              Exportar Excel
            </button>
          </div>
        </div>
      )}

      {status.kind !== "idle" && status.message && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            status.kind === "error"
              ? "border-bad/30 bg-bad/10 text-bad"
              : status.kind === "working"
              ? "border-line bg-surface text-secondary"
              : "border-good/30 bg-good/10 text-good"
          }`}
        >
          {status.kind === "working" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          <span className="min-w-0 flex-1">{status.message}</span>
          {status.undo && (
            <button
              onClick={status.undo}
              className="cursor-pointer whitespace-nowrap rounded-full border border-good/40 px-3 py-1 text-xs font-semibold text-good transition-colors duration-150 hover:bg-good/10"
            >
              Deshacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
