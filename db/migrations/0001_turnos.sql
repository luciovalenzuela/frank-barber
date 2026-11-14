-- Etapa 1 del sistema de turnos: clientes y turnos.
-- Los servicios y los barberos viven en src/content/site.ts; acá se guarda su `id`.

create extension if not exists btree_gist;

create table clients (
  id uuid primary key default gen_random_uuid(),
  -- Siempre en minúsculas: es lo que identifica al cliente.
  email text not null unique,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id),
  barber_id text not null,
  -- false cuando el cliente eligió "sin preferencia" y el barbero lo asignó el sistema.
  barber_chosen boolean not null default true,
  service_id text not null,
  -- Copia del nombre, precio y duración al momento de reservar, para que el
  -- historial no cambie cuando se actualicen los precios.
  service_name text not null,
  price_ars integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  -- Clave secreta del link que recibe el cliente para ver o cancelar su turno.
  manage_token text not null unique,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  check (ends_at > starts_at),
  -- La base rechaza dos turnos confirmados del mismo barbero que se pisen,
  -- aunque dos personas reserven en el mismo instante.
  constraint appointments_no_overlap exclude using gist (
    barber_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed')
);

create index appointments_client_idx on appointments (client_id, starts_at desc);
create index appointments_starts_at_idx on appointments (starts_at);

-- Supabase publica las tablas por una API propia. Con RLS activado y sin
-- políticas, esa API no puede leer ni escribir: solo accede el servidor del sitio.
alter table clients enable row level security;
alter table appointments enable row level security;
