"use client";

import type { ReactNode } from "react";
import AccountModal from "@/components/AccountModal";
import AddTransactionModal from "@/components/AddTransactionModal";
import ColumnMapperModal from "@/components/ColumnMapperModal";
import ControlBar from "@/components/ControlBar";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { FinanzappProvider, useFinanzapp } from "@/context/finanzapp-context";
import { SIN_CUENTA } from "@/lib/analytics";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <FinanzappProvider>
      <Shell>{children}</Shell>
    </FinanzappProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const {
    accounts,
    pendingFiles,
    setPendingFiles,
    processFiles,
    showAddModal,
    editingTx,
    setShowAddModal,
    setEditingTx,
    handleAddTransaction,
    handleUpdateTransaction,
    mapper,
    setMapper,
    handleMapping,
  } = useFinanzapp();

  return (
    <div className="flex min-h-dvh">
      <Sidebar />

      {pendingFiles && (
        <AccountModal
          files={pendingFiles}
          accounts={accounts.filter((a) => a !== SIN_CUENTA)}
          onConfirm={(account) => processFiles(pendingFiles, account)}
          onCancel={() => setPendingFiles(null)}
        />
      )}

      {(showAddModal || editingTx) && (
        <AddTransactionModal
          accounts={accounts.filter((a) => a !== SIN_CUENTA)}
          initial={editingTx ?? undefined}
          onConfirm={editingTx ? handleUpdateTransaction : handleAddTransaction}
          onCancel={() => {
            setShowAddModal(false);
            setEditingTx(null);
          }}
        />
      )}

      {mapper && (
        <ColumnMapperModal
          rows={mapper.rows}
          fileName={mapper.fileName}
          onConfirm={handleMapping}
          onCancel={() => setMapper(null)}
        />
      )}

      <div className="min-w-0 flex-1">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <ControlBar />
          {children}
        </main>
      </div>
    </div>
  );
}
