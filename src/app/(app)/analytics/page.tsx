"use client";

import AnalyticsPanel from "@/components/AnalyticsPanel";
import EmptyState from "@/components/EmptyState";
import { useFinanzapp } from "@/context/finanzapp-context";

export default function AnalyticsPage() {
  const { hasData, visible, handleFiles } = useFinanzapp();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-secondary">Evolución mensual y desglose por categoría.</p>
      </div>

      {!hasData ? <EmptyState onFiles={handleFiles} /> : <AnalyticsPanel transactions={visible} />}
    </div>
  );
}
