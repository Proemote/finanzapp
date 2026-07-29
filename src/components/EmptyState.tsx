"use client";

import Link from "next/link";
import UploadZone from "@/components/UploadZone";

export default function EmptyState({ onFiles }: { onFiles: (files: File[]) => void }) {
  return (
    <div className="space-y-4">
      <UploadZone onFiles={onFiles} />
      <p className="text-center text-sm text-secondary">
        Aún no hay movimientos.{" "}
        <Link href="/" className="font-medium text-violet hover:underline">
          Vuelve al Dashboard
        </Link>{" "}
        para cargar datos guardados o añadir uno a mano.
      </p>
    </div>
  );
}
