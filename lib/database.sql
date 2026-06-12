-- StockScan — Schema de Supabase
-- Ejecutar en el SQL Editor del proyecto de Supabase.

-- ── Perfiles ────────────────────────────────────────────────────────────
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  plan text not null default 'gratuito' check (plan in ('gratuito', 'pro', 'max')),
  created_at timestamptz not null default now()
);

alter table public.perfiles enable row level security;

drop policy if exists "Los usuarios ven su propio perfil" on public.perfiles;
create policy "Los usuarios ven su propio perfil"
  on public.perfiles for select
  using (auth.uid() = id);

drop policy if exists "Los usuarios actualizan su propio perfil" on public.perfiles;
create policy "Los usuarios actualizan su propio perfil"
  on public.perfiles for update
  using (auth.uid() = id);

-- ── Productos ───────────────────────────────────────────────────────────
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  codigo text not null,
  nombre text not null,
  categoria text,
  imagen_url text,
  cantidad integer not null default 1 check (cantidad >= 0),
  descripcion text,
  especificaciones text[],
  precio numeric check (precio is null or precio >= 0),
  created_at timestamptz not null default now()
);

-- Migración para instalaciones anteriores a la columna de descripción:
alter table public.productos add column if not exists descripcion text;
alter table public.productos add column if not exists especificaciones text[];

-- Migración: precio del producto en pesos colombianos (COP), opcional.
alter table public.productos
  add column if not exists precio numeric check (precio is null or precio >= 0);

create index if not exists productos_user_id_idx on public.productos (user_id);

-- Un mismo código no puede repetirse por usuario (la app también lo bloquea).
-- Si esta línea falla es porque ya tienes códigos duplicados; encuéntralos con:
--   select user_id, codigo, count(*) from public.productos
--   group by user_id, codigo having count(*) > 1;
-- y elimina o corrige los repetidos antes de volver a ejecutar.
create unique index if not exists productos_user_codigo_unico
  on public.productos (user_id, codigo);

alter table public.productos enable row level security;

drop policy if exists "Los usuarios ven sus propios productos" on public.productos;
create policy "Los usuarios ven sus propios productos"
  on public.productos for select
  using (auth.uid() = user_id);

drop policy if exists "Los usuarios insertan sus propios productos" on public.productos;
create policy "Los usuarios insertan sus propios productos"
  on public.productos for insert
  with check (auth.uid() = user_id);

drop policy if exists "Los usuarios actualizan sus propios productos" on public.productos;
create policy "Los usuarios actualizan sus propios productos"
  on public.productos for update
  using (auth.uid() = user_id);

drop policy if exists "Los usuarios eliminan sus propios productos" on public.productos;
create policy "Los usuarios eliminan sus propios productos"
  on public.productos for delete
  using (auth.uid() = user_id);

-- ── Pedidos pendientes (recordatorios de compra) ────────────────────────
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists pedidos_user_id_idx on public.pedidos (user_id);

alter table public.pedidos enable row level security;

drop policy if exists "Los usuarios ven sus propios pedidos" on public.pedidos;
create policy "Los usuarios ven sus propios pedidos"
  on public.pedidos for select
  using (auth.uid() = user_id);

drop policy if exists "Los usuarios insertan sus propios pedidos" on public.pedidos;
create policy "Los usuarios insertan sus propios pedidos"
  on public.pedidos for insert
  with check (auth.uid() = user_id);

drop policy if exists "Los usuarios eliminan sus propios pedidos" on public.pedidos;
create policy "Los usuarios eliminan sus propios pedidos"
  on public.pedidos for delete
  using (auth.uid() = user_id);

-- ── Combos guardados (propuestos por el asistente) ──────────────────────
create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  descripcion text,
  -- items: [{ "producto_id": uuid|null, "nombre": text, "cantidad": int, "precio": numeric|null }]
  items jsonb not null default '[]'::jsonb,
  precio_total numeric,
  created_at timestamptz not null default now()
);

create index if not exists combos_user_id_idx on public.combos (user_id);

alter table public.combos enable row level security;

drop policy if exists "Los usuarios ven sus propios combos" on public.combos;
create policy "Los usuarios ven sus propios combos"
  on public.combos for select
  using (auth.uid() = user_id);

drop policy if exists "Los usuarios insertan sus propios combos" on public.combos;
create policy "Los usuarios insertan sus propios combos"
  on public.combos for insert
  with check (auth.uid() = user_id);

drop policy if exists "Los usuarios eliminan sus propios combos" on public.combos;
create policy "Los usuarios eliminan sus propios combos"
  on public.combos for delete
  using (auth.uid() = user_id);

-- ── Trigger: crear perfil al registrarse ────────────────────────────────
-- El plan elegido en el registro llega en raw_user_meta_data.plan.
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, email, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'plan', 'gratuito')
  );
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();
