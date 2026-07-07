-- Finanzapp — tabla para la fase MVP single-user (sin auth)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar y Run
--
-- NOTA: este proyecto ya contiene el modelo completo multi-usuario
-- (accounts, categories, transactions, merchant_rules con RLS por user_id,
-- ver finazapp-context.md). NO lo tocamos: esta tabla separada sirve solo
-- para el MVP sin login. Al activar Supabase Auth, migraremos los datos a
-- `transactions` y eliminaremos esta tabla.

create table if not exists public.transactions_mvp (
  id text primary key,
  date date not null,
  description text not null,
  amount numeric(12, 2) not null,
  category text not null default 'Sin clasificar',
  source text not null default '',
  created_at timestamptz not null default now()
);

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
