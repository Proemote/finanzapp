"use client";

import AnalyticsPanel from "@/components/AnalyticsPanel";
import EmptyState from "@/components/EmptyState";
import TrendCharts from "@/components/TrendCharts";
import { useFinanzapp } from "@/context/finanzapp-context";

export default function AnalyticsPage() {
  const { hasData, periodVisible, handleFiles } = useFinanzapp();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-secondary">Evolución mensual y desglose por categoría.</p>
      </div>

      {!hasData ? (
        <EmptyState onFiles={handleFiles} />
      ) : (
        <div className="space-y-5">
          <AnalyticsPanel transactions={periodVisible} />
          <TrendCharts transactions={periodVisible} />
        </div>
      )}
    </div>
  );
}
