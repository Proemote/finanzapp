-- Finanzapp — tabla para la fase MVP single-user (sin auth)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar y Run
--
-- ⚠️ Este script deja la tabla con RLS "open access" (using (true)) —
-- histórico de la fase inicial sin login. Ya NO representa el estado
-- deseado: con Supabase Auth activo, aplica también
-- migration_user_isolation.sql (mismo directorio) para tener aislamiento
-- real por usuario. Si estás montando el proyecto desde cero, ejecuta este
-- archivo primero y migration_user_isolation.sql justo después.

create table if not exists public.transactions_mvp (
  id text primary key,
  date date not null,
  description text not null,
  amount numeric(12, 2) not null,
  category text not null default 'Sin clasificar',
  account text not null default '',
  source text not null default '',
  created_at timestamptz not null default now()
);

-- Migración para tablas creadas antes de añadir cuentas bancarias
alter table public.transactions_mvp
  add column if not exists account text not null default '';

create index if not exists transactions_mvp_date_idx on public.transactions_mvp (date);
create index if not exists transactions_mvp_category_idx on public.transactions_mvp (category);

-- RLS activado con política abierta TEMPORAL para la fase single-user.
alter table public.transactions_mvp enable row level security;

drop policy if exists "open access (single-user MVP)" on public.transactions_mvp;
create policy "open access (single-user MVP)"
  on public.transactions_mvp
  for all
  using (true)
  with check (true);
