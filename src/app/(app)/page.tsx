"use client";

import ChartsPanel from "@/components/ChartsPanel";
import SummaryCards from "@/components/SummaryCards";
import UploadZone from "@/components/UploadZone";
import { useFinanzapp } from "@/context/finanzapp-context";

export default function DashboardPage() {
  const { hasData, visible, totalsVisible, monthsVisible, handleFiles, handleLoad, setShowAddModal } =
    useFinanzapp();

  return (
    <div className="space-y-5">
      <div className="mb-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-secondary">Bienvenido a tu panorama financiero.</p>
        </div>
      </div>

      {!hasData ? (
        <div className="space-y-5">
          <UploadZone onFiles={handleFiles} />
          <p className="flex flex-wrap justify-center gap-2 text-center">
            <button
              onClick={handleLoad}
              className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium text-violet transition-colors duration-150 hover:bg-violet/10"
            >
              …o cargar movimientos guardados en Supabase
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium text-violet transition-colors duration-150 hover:bg-violet/10"
            >
              …o añadir un movimiento a mano
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <SummaryCards balance={totalsVisible.balance} months={monthsVisible} />
          <ChartsPanel transactions={visible} />
        </div>
      )}
    </div>
  );
}
