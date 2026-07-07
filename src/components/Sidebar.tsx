"use client";

import {
  ArrowLeftRight,
  LayoutDashboard,
  LineChart,
  Settings,
  Wallet,
} from "lucide-react";

interface Props {
  hasData: boolean;
}

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "#dashboard", active: true },
  { label: "Movimientos", icon: ArrowLeftRight, href: "#movimientos", active: false },
  { label: "Analytics", icon: LineChart, href: "#", active: false, soon: true },
  { label: "Cuentas", icon: Wallet, href: "#cuentas", active: false },
];

export default function Sidebar({ hasData }: Props) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-deep">
          <Wallet className="h-5 w-5 text-white" aria-hidden />
        </div>
        <div>
          <p className="text-base font-bold leading-tight">Finanzapp</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Premium Finance
          </p>
        </div>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3" aria-label="Principal">
        {NAV.map(({ label, icon: Icon, href, active, soon }) => (
          <a
            key={label}
            href={soon || !hasData ? undefined : href}
            aria-disabled={soon || !hasData}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
              active
                ? "border border-violet/40 bg-violet-deep/25 text-foreground"
                : soon || !hasData
                ? "cursor-default text-muted"
                : "cursor-pointer text-secondary hover:bg-white/[.04] hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
            {soon && (
              <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
                pronto
              </span>
            )}
          </a>
        ))}
      </nav>

      <div className="border-t border-line px-3 py-4">
        <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted">
          <Settings className="h-4 w-4" aria-hidden />
          Configuración
          <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[10px]">
            pronto
          </span>
        </span>
      </div>
    </aside>
  );
}
