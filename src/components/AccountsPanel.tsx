"use client";

import { Landmark } from "lucide-react";
import { accountSummaries, formatEUR } from "@/lib/analytics";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
}

export default function AccountsPanel({ transactions }: Props) {
  const accounts = accountSummaries(transactions);
  if (accounts.length === 0) return null;

  return (
    <section id="cuentas" className="card p-5">
      <h3 className="text-base font-semibold">Cuentas</h3>
      <p className="mt-0.5 text-xs text-muted">Balance por cuenta bancaria</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {accounts.map((a) => {
          const spentPct = a.income > 0 ? Math.min((a.expense / a.income) * 100, 100) : a.expense > 0 ? 100 : 0;
          return (
            <div key={a.account} className="rounded-2xl border border-line bg-surface-2 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet/15 text-violet">
                  <Landmark className="h-4 w-4" aria-hidden />
                </span>
                <p className="truncate text-sm font-medium">{a.account}</p>
              </div>
              <p
                className={`mt-2 text-xl font-bold tracking-tight ${
                  a.balance < 0 ? "text-bad" : "text-foreground"
                }`}
              >
                {formatEUR(a.balance)}
              </p>
              <p className="mt-1 text-xs text-muted">
                <span className="text-good">+{formatEUR(a.income)}</span>
                {" · "}
                <span className="text-bad">−{formatEUR(a.expense)}</span>
                {" · "}
                {a.count} mov.
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full ${a.balance < 0 ? "bg-bad" : "bg-violet"}`}
                  style={{ width: `${Math.max(spentPct, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
