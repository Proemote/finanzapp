"use client";

import EmptyState from "@/components/EmptyState";
import TransactionsTable from "@/components/TransactionsTable";
import UploadZone from "@/components/UploadZone";
import { useFinanzapp } from "@/context/finanzapp-context";

export default function MovimientosPage() {
  const { hasData, visible, query, handleCategoryChange, setEditingTx, handleDeleteTransaction, handleFiles } =
    useFinanzapp();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Movimientos</h1>
        <p className="mt-1 text-sm text-secondary">Todos tus ingresos y gastos, clasificados.</p>
      </div>

      {!hasData ? (
        <EmptyState onFiles={handleFiles} />
      ) : (
        <div className="space-y-5">
          <TransactionsTable
            transactions={visible}
            query={query}
            onCategoryChange={handleCategoryChange}
            onEdit={setEditingTx}
            onDelete={handleDeleteTransaction}
          />
          <UploadZone onFiles={handleFiles} compact />
        </div>
      )}
    </div>
  );
}
