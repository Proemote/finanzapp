"use client";

import { useMemo, useState } from "react";
import { TableProperties, X } from "lucide-react";
import { parseWithMapping, type ManualMapping, type Row } from "@/lib/parse";

interface Props {
  rows: Row[];
  fileName: string;
  onConfirm: (mapping: ManualMapping) => void;
  onCancel: () => void;
}

const PREVIEW_ROWS = 6;
const MAX_COLS = 12;

const colLetter = (i: number) => String.fromCharCode(65 + i);

function cellText(value: Row[number]): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) return value.toLocaleDateString("es-ES");
  return String(value);
}

export default function ColumnMapperModal({ rows, fileName, onConfirm, onCancel }: Props) {
  const colCount = Math.min(
    MAX_COLS,
    Math.max(...rows.slice(0, 20).map((r) => r?.length ?? 0), 0)
  );
  const [dateCol, setDateCol] = useState(-1);
  const [descCol, setDescCol] = useState(-1);
  const [amountCol, setAmountCol] = useState(-1);
  const [skipFirstRow, setSkipFirstRow] = useState(true);

  const ready =
    dateCol > -1 &&
    descCol > -1 &&
    amountCol > -1 &&
    new Set([dateCol, descCol, amountCol]).size === 3;

  const detected = useMemo(() => {
    if (!ready) return null;
    return parseWithMapping(rows, fileName, {
      date: dateCol,
      description: descCol,
      amount: amountCol,
      skipFirstRow,
    }).transactions.length;
  }, [ready, rows, fileName, dateCol, descCol, amountCol, skipFirstRow]);

  // Primeras y últimas filas: si hay preámbulo basura, los datos reales suelen
  // estar al final y el usuario necesita verlos para mapear.
  const preview: (Row | "gap")[] =
    rows.length <= PREVIEW_ROWS ? rows : [...rows.slice(0, 3), "gap", ...rows.slice(-3)];

  const roleOf = (col: number) =>
    col === dateCol ? "Fecha" : col === descCol ? "Concepto" : col === amountCol ? "Importe" : null;

  const selectCls =
    "mt-1.5 w-full cursor-pointer rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-violet";

  const fields: { label: string; value: number; set: (v: number) => void }[] = [
    { label: "Fecha", value: dateCol, set: setDateCol },
    { label: "Concepto", value: descCol, set: setDescCol },
    { label: "Importe", value: amountCol, set: setAmountCol },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mapper-title"
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div className="card w-full max-w-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 text-violet">
              <TableProperties className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="mapper-title" className="text-base font-semibold">
                No hemos reconocido las columnas
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {fileName} — indícanos qué columna es cada cosa
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cancelar importación"
            className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-white/[.06] hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {fields.map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-sm text-secondary">{label}</label>
              <select
                value={value}
                onChange={(e) => set(Number(e.target.value))}
                aria-label={`Columna para ${label}`}
                className={selectCls}
              >
                <option value={-1}>Elegir columna…</option>
                {Array.from({ length: colCount }, (_, i) => (
                  <option key={i} value={i}>
                    Columna {colLetter(i)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-2 text-left text-muted">
                {Array.from({ length: colCount }, (_, i) => {
                  const role = roleOf(i);
                  return (
                    <th key={i} className="whitespace-nowrap px-3 py-2 font-medium">
                      {colLetter(i)}
                      {role && (
                        <span className="ml-1.5 rounded-full bg-violet/20 px-1.5 py-0.5 text-[10px] text-violet">
                          {role}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, r) =>
                row === "gap" ? (
                  <tr key="gap" className="border-t border-line">
                    <td colSpan={colCount} className="px-3 py-1 text-center text-muted">
                      ⋯ {rows.length - 6} filas más ⋯
                    </td>
                  </tr>
                ) : (
                  <tr key={r} className="border-t border-line">
                    {Array.from({ length: colCount }, (_, c) => (
                      <td
                        key={c}
                        className={`max-w-48 truncate px-3 py-1.5 ${
                          roleOf(c) ? "bg-violet/5 text-foreground" : "text-secondary"
                        }`}
                      >
                        {cellText(row?.[c])}
                      </td>
                    ))}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary">
            <input
              type="checkbox"
              checked={skipFirstRow}
              onChange={(e) => setSkipFirstRow(e.target.checked)}
              className="h-4 w-4 accent-[var(--violet-deep)]"
            />
            La primera fila son cabeceras
          </label>
          {ready && (
            <p className={`text-sm ${detected ? "text-good" : "text-bad"}`}>
              {detected
                ? `Se detectarán ${detected} movimientos`
                : "Con esas columnas no se detecta ningún movimiento"}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-medium text-secondary transition-colors duration-150 hover:border-line-strong hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              onConfirm({ date: dateCol, description: descCol, amount: amountCol, skipFirstRow })
            }
            disabled={!ready || !detected}
            className="cursor-pointer rounded-full bg-violet-deep px-5 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Importar
          </button>
        </div>
      </div>
    </div>
  );
}
