"use client";

import { useState } from "react";
import { CloudDownload, CloudUpload, Download, Loader2, Plus, Trash2 } from "lucide-react";
import ExportModal, { type ExportConfirmOptions } from "@/components/ExportModal";
import PeriodSelector from "@/components/PeriodSelector";
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
    handleClearAll,
    periodPreset,
    customRange,
  } = useFinanzapp();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const accountLabel =
    activeAccount === ALL_ACCOUNTS
      ? "Todas las cuentas"
      : activeAccount === SIN_CUENTA
      ? "Sin cuenta"
      : activeAccount;

  const confirmExport = (options: ExportConfirmOptions) => {
    setShowExportModal(false);
    void handleExport(options);
  };

  if (!hasData && status.kind === "idle") return null;

  return (
    <div className="mb-6 space-y-4">
      {hasData && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector />
            {accounts.length > 1 && (
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
            )}
          </div>

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
              onClick={() => setShowExportModal(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-violet-deep px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            >
              <Download className="h-4 w-4" aria-hidden />
              Exportar Excel
            </button>

            {confirmingClear ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-bad/40 bg-bad/10 px-3 py-1.5 text-sm text-bad">
                <span>¿Vaciar todo?</span>
                <button
                  onClick={() => {
                    setConfirmingClear(false);
                    handleClearAll();
                  }}
                  className="cursor-pointer rounded-full bg-bad px-3 py-1 font-semibold text-white transition-opacity duration-150 hover:opacity-90"
                >
                  Sí, vaciar
                </button>
                <button
                  onClick={() => setConfirmingClear(false)}
                  className="cursor-pointer rounded-full px-2 py-1 text-secondary hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingClear(true)}
                title="Borra todos los movimientos (local y Supabase) para reimportar sin duplicados"
                className={`${actionBtn} hover:border-bad/40 hover:text-bad`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Vaciar todo
              </button>
            )}
          </div>
        </div>
      )}

      {status.kind !== "idle" && status.message && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            status.kind === "error"
              ? "border-bad/30 bg-bad/10 text-bad"
              : status.kind === "warning"
              ? "border-warn/30 bg-warn/10 text-warn"
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

      {showExportModal && (
        <ExportModal
          defaultPreset={periodPreset}
          defaultCustomRange={customRange}
          accountLabel={accountLabel}
          onConfirm={confirmExport}
          onCancel={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
