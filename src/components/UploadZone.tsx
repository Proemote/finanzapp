"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Plus, UploadCloud } from "lucide-react";

interface Props {
  onFiles: (files: File[]) => void;
  compact?: boolean;
}

export default function UploadZone({ onFiles, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed text-center transition-colors duration-200 ${
        dragging
          ? "border-violet bg-violet/10"
          : "border-line-strong hover:border-violet/60 hover:bg-white/[.02]"
      } ${compact ? "p-4" : "p-14"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx,.txt"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {compact ? (
        <p className="flex items-center justify-center gap-2 text-sm text-secondary">
          <Plus className="h-4 w-4" aria-hidden /> Añadir otro archivo (CSV / Excel)
        </p>
      ) : (
        <>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet/15">
            <FileSpreadsheet className="h-8 w-8 text-violet" aria-hidden />
          </span>
          <h2 className="mt-6 text-2xl font-bold">Sube tu extracto bancario</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-secondary">
            Arrastra aquí un CSV o Excel (.xlsx, .xls) exportado de tu banco. Detectamos las
            columnas automáticamente y clasificamos cada movimiento con IA.
          </p>
          <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-violet-deep px-6 py-3 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90">
            <UploadCloud className="h-4 w-4" aria-hidden />
            Elegir archivo
          </span>
        </>
      )}
    </div>
  );
}
