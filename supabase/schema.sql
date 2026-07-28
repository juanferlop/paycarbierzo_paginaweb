-- Ejecuta este SQL en Supabase SQL Editor.

create table if not exists public.obras (
  id bigint generated always as identity primary key,
  pueblo text not null,
  tipo text not null,
  fecha text not null,
  imagenes text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.obras enable row level security;

-- Lectura publica para que la web pueda pintar tarjetas.
drop policy if exists "obras_select_public" on public.obras;
create policy "obras_select_public"
on public.obras
for select
to anon
using (true);

-- Insercion publica para app simple sin login.
drop policy if exists "obras_insert_public" on public.obras;
create policy "obras_insert_public"
on public.obras
for insert
to anon
with check (true);

-- Bucket publico para fotos.
insert into storage.buckets (id, name, public)
values ('obras-public', 'obras-public', true)
on conflict (id) do nothing;

-- Permite subir y leer archivos del bucket publico.
drop policy if exists "storage_public_read_obras" on storage.objects;
create policy "storage_public_read_obras"
on storage.objects
for select
to anon
using (bucket_id = 'obras-public');

drop policy if exists "storage_public_insert_obras" on storage.objects;
create policy "storage_public_insert_obras"
on storage.objects
for insert
to anon
with check (bucket_id = 'obras-public');
