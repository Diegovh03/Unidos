# Activar "Nuestro Espacio" (fotos compartidas por día)

Gratis, sin tarjeta. Toma ~5 minutos. El bucket de fotos es **privado** — las fotos se sirven con URLs firmadas temporales, no con un link público fijo.

## 1. Crear proyecto en Supabase

1. Ve a https://supabase.com → **Start your project** → crea cuenta (con GitHub o email).
2. **New project**: nombre `nuestro-plan`, elige una contraseña de base de datos (guárdala, no la necesitarás de nuevo) y la región más cercana (ej. `South America` o `Europe West`).
3. Espera ~2 min a que se cree.

## 2. Crear la tabla y el bucket de fotos

En el proyecto, ve a **SQL Editor** → **New query**, pega esto y dale **Run**:

```sql
create table if not exists momentos (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  persona text not null check (persona in ('diego', 'bianka')),
  foto_path text not null,
  caption text default '',
  destino text not null default 'ambos' check (destino in ('collage', 'recuerdos', 'ambos')),
  categoria text not null default 'nosotros'
    check (categoria in ('nosotros', 'viajes', 'especial', 'comida', 'naturaleza', 'ciudad', 'casa', 'otros')),
  created_at timestamptz default now(),
  unique (date, persona)
);

alter table momentos enable row level security;

create policy "momentos select anon" on momentos for select using (true);
create policy "momentos insert anon" on momentos for insert with check (true);
create policy "momentos update anon" on momentos for update using (true);

-- Bucket PRIVADO (public = false). Si ya habías creado uno a mano con otro
-- nombre (ej. por un typo), bórralo desde Storage en el dashboard para no
-- tener dos buckets sueltos — este script crea el único que la app usa.
insert into storage.buckets (id, name, public)
values ('momentos', 'momentos', false)
on conflict (id) do update set public = false;

create policy "momentos bucket select" on storage.objects
  for select using (bucket_id = 'momentos');
create policy "momentos bucket insert" on storage.objects
  for insert with check (bucket_id = 'momentos');
create policy "momentos bucket update" on storage.objects
  for update using (bucket_id = 'momentos');
```

> Si ya habías creado la tabla `momentos` antes con `foto_url` (versión pública anterior), lo más simple es borrar esa tabla vieja y correr el script de arriba de nuevo — no hay fotos reales guardadas todavía, así que no se pierde nada:
> ```sql
> drop table if exists momentos;
> ```
> …y después corre el bloque de creación de arriba completo.

> Nota de privacidad: las políticas de arriba permiten leer/escribir sin login (igual que el resto de la app, que no tiene sistema de usuarios) — el bucket es privado ante el mundo, pero no hay una cuenta de "Diego" o "Bianka" distinguiéndose entre sí a nivel de base de datos. Para una app privada de pareja es un riesgo aceptable, pero es bueno saberlo.

## 3. Copiar las credenciales

En **Project Settings** (ícono engranaje) → **API**:
- Copia **Project URL**
- Copia la **Publishable key** (empieza con `sb_publishable_...`). NO copies la `service_role` / `secret key` — esa nunca debe ir en el código del frontend.

## 4. Pegarlas en el código

Abre `js/diario-config.js` y reemplaza:

```js
export const diarioConfig = {
  enabled: true,
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  supabaseAnonKey: "TU-PUBLISHABLE-KEY",
  bucket: "momentos",
  table: "momentos",
};
```

Guarda, recarga la app (o vuelve a hacer deploy) y listo — **Nuestro Espacio** (botón "Espacio" abajo) ya debería dejar subir y ver las fotos del día entre los dos, armando el collage.
