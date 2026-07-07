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
        {accounts.map((a) => (
          <div key={a.account} className="rounded-xl border border-line bg-surface-2 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet/15 text-violet">
                <Landmark className="h-3.5 w-3.5" aria-hidden />
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
          </div>
        ))}
      </div>
    </section>
  );
}
