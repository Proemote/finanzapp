"use client";

import EmptyState from "@/components/EmptyState";
import RecurringPanel from "@/components/RecurringPanel";
import { useFinanzapp } from "@/context/finanzapp-context";

export default function RecurrentesPage() {
  const { hasData, visible, handleFiles } = useFinanzapp();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Recurrentes</h1>
        <p className="mt-1 text-sm text-secondary">
          Suscripciones y pagos periódicos detectados automáticamente.
        </p>
      </div>

      {!hasData ? (
        <EmptyState onFiles={handleFiles} />
      ) : (
        <RecurringPanel transactions={visible} />
      )}
    </div>
  );
}
