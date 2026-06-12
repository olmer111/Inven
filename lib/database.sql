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
  created_at timestamptz not null default now()
);

-- Migración para instalaciones anteriores a la columna de descripción:
alter table public.productos add column if not exists descripcion text;
alter table public.productos add column if not exists especificaciones text[];

create index if not exists productos_user_id_idx on public.productos (user_id);

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
