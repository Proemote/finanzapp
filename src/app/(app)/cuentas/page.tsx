"use client";

import AccountsPanel from "@/components/AccountsPanel";
import EmptyState from "@/components/EmptyState";
import TransferSuggestions from "@/components/TransferSuggestions";
import { useFinanzapp } from "@/context/finanzapp-context";

export default function CuentasPage() {
  const { hasData, transactions, handleFiles } = useFinanzapp();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Cuentas</h1>
        <p className="mt-1 text-sm text-secondary">Balance por cuenta bancaria.</p>
      </div>

      {!hasData ? (
        <EmptyState onFiles={handleFiles} />
      ) : (
        <div className="space-y-5">
          <AccountsPanel transactions={transactions} />
          <TransferSuggestions transactions={transactions} />
        </div>
      )}
    </div>
  );
}
