"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import type { ExportSections } from "@/lib/export";
import { PERIOD_PRESETS, type PeriodPreset } from "@/lib/period";

export interface ExportConfirmOptions {
  preset: PeriodPreset;
  customStart?: string;
  customEnd?: string;
  sections: ExportSections;
}

interface Props {
  defaultPreset: PeriodPreset;
  defaultCustomRange: { start: string; end: string } | null;
  accountLabel: string;
  onConfirm: (options: ExportConfirmOptions) => void;
  onCancel: () => void;
}

const inputCls =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-violet";

const checkboxRow = "flex items-start gap-2.5 rounded-lg px-1 py-1.5";

function SectionCheckbox({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className={`${checkboxRow} ${disabled ? "opacity-50" : "cursor-pointer hover:bg-foreground/[.04]"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-violet disabled:cursor-not-allowed"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

/** Modal de exportación: elige período y qué hojas incluir en el Excel descargado. */
export default function ExportModal({
  defaultPreset,
  defaultCustomRange,
  accountLabel,
  onConfirm,
  onCancel,
}: Props) {
  const [preset, setPreset] = useState<PeriodPreset>(defaultPreset);
  const [customStart, setCustomStart] = useState(defaultCustomRange?.start ?? "");
  const [customEnd, setCustomEnd] = useState(defaultCustomRange?.end ?? "");
  const [categorias, setCategorias] = useState(true);
  const [cuentas, setCuentas] = useState(true);
  const [resumenAnual, setResumenAnual] = useState(true);
  const [mensualSemanal, setMensualSemanal] = useState(true);

  const submit = () => {
    onConfirm({
      preset,
      customStart: preset === "custom" ? customStart : undefined,
      customEnd: preset === "custom" ? customEnd : undefined,
      sections: { categorias, cuentas, resumenAnual, mensualSemanal },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 text-violet">
              <Download className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="export-modal-title" className="text-base font-semibold">
                Exportar Excel
              </h2>
              <p className="mt-0.5 text-xs text-muted">{accountLabel}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cerrar"
            className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-foreground/[.08] hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-5">
          <label htmlFor="export-period" className="block text-sm text-secondary">
            Período a exportar
          </label>
          <select
            id="export-period"
            value={preset}
            onChange={(e) => setPreset(e.target.value as PeriodPreset)}
            className={`${inputCls} mt-1.5 cursor-pointer`}
          >
            {PERIOD_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {preset === "custom" && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="date"
                aria-label="Desde"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className={inputCls}
              />
              <span className="text-xs text-muted">–</span>
              <input
                type="date"
                aria-label="Hasta"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className={inputCls}
              />
            </div>
          )}
        </div>

        <div className="mt-5">
          <p className="text-sm text-secondary">Hojas a incluir</p>
          <div className="mt-1.5 space-y-0.5">
            <SectionCheckbox label="Movimientos y resumen mensual" hint="Siempre incluido" checked disabled />
            <SectionCheckbox
              label="Categorías"
              hint="Desglose de ingresos y gastos por categoría"
              checked={categorias}
              onChange={setCategorias}
            />
            <SectionCheckbox
              label="Cuentas"
              hint="Balance por cuenta bancaria"
              checked={cuentas}
              onChange={setCuentas}
            />
            <SectionCheckbox
              label="Resumen anual"
              hint="Comparativa año a año"
              checked={resumenAnual}
              onChange={setResumenAnual}
            />
            <SectionCheckbox
              label="Hojas mensuales con desglose semanal"
              hint="Una hoja por mes, con ingresos/gastos por semana"
              checked={mensualSemanal}
              onChange={setMensualSemanal}
            />
            <SectionCheckbox
              label="Suscripciones"
              hint="Próximamente — pendiente del panel de recurrentes"
              checked={false}
              disabled
            />
            <SectionCheckbox
              label="Transferencias internas"
              hint="Próximamente — pendiente de la detección de transferencias"
              checked={false}
              disabled
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-medium text-secondary transition-colors duration-150 hover:border-line-strong hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-violet-deep px-5 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
          >
            <Download className="h-4 w-4" aria-hidden />
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}
