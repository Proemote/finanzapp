-- Finanzapp — Aislamiento real por usuario en transactions_mvp
-- ⚠️ TODO PRIORITARIO desde el 29 jul (ver APP_STATUS.md): la tabla tenía RLS
-- con política "open access" (using (true)) y ninguna columna user_id — con
-- el login real ya activo, esto significa que CUALQUIER usuario autenticado
-- (o incluso alguien sin sesión, llamando directo a la API con la clave
-- pública) ve/edita/borra los movimientos de todos los demás.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar y Run.
-- Ejecuta los pasos EN ORDEN, uno detrás de otro (no todo de golpe), y lee
-- el resultado del Paso 0 antes de continuar.

-- ============================================================
-- PASO 0 — comprobación de seguridad antes de tocar nada
-- ============================================================
-- Cuántos usuarios hay dados de alta. Si el resultado es 1, el backfill
-- automático del Paso 2 es seguro (todo lo existente es tuyo). Si es más de
-- 1, PARA AQUÍ y dime cuántos hay antes de seguir — el backfill automático
-- asumiría que todo pertenece al usuario más antiguo, lo cual sería
-- incorrecto si ya se ha registrado alguien más.
select count(*) as total_usuarios from auth.users;

-- ============================================================
-- PASO 1 — añadir la columna user_id (nullable de momento)
-- ============================================================
alter table public.transactions_mvp
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- ============================================================
-- PASO 2 — backfill: todo lo existente pasa a ser del primer usuario
-- ============================================================
-- Solo ejecutar si el Paso 0 dio total_usuarios = 1.
update public.transactions_mvp
set user_id = (select id from auth.users order by created_at asc limit 1)
where user_id is null;

-- Comprobación: no debería quedar ninguna fila sin user_id.
select count(*) as filas_sin_user_id from public.transactions_mvp where user_id is null;

-- ============================================================
-- PASO 3 — hacer la columna obligatoria y con valor por defecto
-- ============================================================
-- default auth.uid(): red de seguridad extra — si el código de la app
-- alguna vez olvida mandar user_id en un insert, Postgres lo rellena solo
-- con el usuario de la sesión que hace la petición.
alter table public.transactions_mvp
  alter column user_id set default auth.uid();

alter table public.transactions_mvp
  alter column user_id set not null;

create index if not exists transactions_mvp_user_id_idx on public.transactions_mvp (user_id);

-- ============================================================
-- PASO 4 — sustituir la política abierta por aislamiento real
-- ============================================================
drop policy if exists "open access (single-user MVP)" on public.transactions_mvp;

create policy "select own transactions"
  on public.transactions_mvp for select
  using (auth.uid() = user_id);

create policy "insert own transactions"
  on public.transactions_mvp for insert
  with check (auth.uid() = user_id);

create policy "update own transactions"
  on public.transactions_mvp for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own transactions"
  on public.transactions_mvp for delete
  using (auth.uid() = user_id);

-- ============================================================
-- PASO 5 — verificación final
-- ============================================================
-- Debe mostrar las 4 políticas nuevas y ninguna "open access".
select policyname, cmd from pg_policies where tablename = 'transactions_mvp';
