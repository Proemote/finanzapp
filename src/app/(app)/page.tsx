"use client";

import CategoryBreakdown from "@/components/CategoryBreakdown";
import ChartsPanel from "@/components/ChartsPanel";
import MonthNav from "@/components/MonthNav";
import MonthWeeklyChart from "@/components/MonthWeeklyChart";
import NarrativeSummary from "@/components/NarrativeSummary";
import SummaryCards from "@/components/SummaryCards";
import TransactionsTable from "@/components/TransactionsTable";
import UploadZone from "@/components/UploadZone";
import { useFinanzapp } from "@/context/finanzapp-context";
import { categorySummaries, monthNarrative, weeklySummaries } from "@/lib/analytics";

export default function DashboardPage() {
  const {
    hasData,
    accounts,
    periodVisible,
    monthVisible,
    prevMonthVisible,
    selectedMonth,
    query,
    setQuery,
    handleFiles,
    handleLoad,
    setShowAddModal,
    handleCategoryChange,
    setEditingTx,
    handleDeleteTransaction,
  } = useFinanzapp();

  const narrative = monthNarrative(monthVisible, prevMonthVisible);
  const expenseCategories = categorySummaries(monthVisible, "expense");
  const weeks = weeklySummaries(monthVisible, selectedMonth);

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
          <MonthNav />
          <NarrativeSummary narrative={narrative} />
          <SummaryCards
            income={narrative.income}
            expense={narrative.expense}
            balance={narrative.balance}
            savingsRate={narrative.savingsRate}
          />

          <div className="grid gap-4 xl:grid-cols-3">
            <section className="card p-5 xl:col-span-1">
              <h3 className="text-base font-semibold">Gastos por categoría</h3>
              <p className="mt-0.5 text-xs text-muted">Pulsa una categoría para ver sus movimientos</p>
              <div className="mt-4">
                <CategoryBreakdown categories={expenseCategories} onSelect={setQuery} />
              </div>
            </section>

            <section className="card p-5 xl:col-span-2">
              <h3 className="text-base font-semibold">Evolución dentro del mes</h3>
              <p className="mt-0.5 text-xs text-muted">Ingresos y gastos acumulados por semana</p>
              <div className="mt-4">
                <MonthWeeklyChart weeks={weeks} />
              </div>
            </section>
          </div>

          <TransactionsTable
            transactions={monthVisible}
            accounts={accounts}
            query={query}
            onCategoryChange={handleCategoryChange}
            onEdit={setEditingTx}
            onDelete={handleDeleteTransaction}
          />

          <ChartsPanel transactions={periodVisible} />
        </div>
      )}
    </div>
  );
}
