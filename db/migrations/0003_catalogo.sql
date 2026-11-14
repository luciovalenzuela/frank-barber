-- Catálogo de la barbería en la base: servicios, barberos y el horario de cada barbero.
-- Desde acá se editan precios, duraciones, barberos y francos (Supabase → Table Editor),
-- sin tocar el código. Los turnos quedan atados a estas tablas con claves foráneas.

create table services (
  -- Identificador estable: se guarda en cada turno. No cambiarlo.
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  description text not null default '',
  -- Qué incluye, en pocas palabras (se muestra al reservar).
  includes text[] not null default '{}',
  price_ars integer not null check (price_ars >= 0),
  -- Múltiplo de 30: los turnos empiezan cada media hora.
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes % 30 = 0),
  -- Etiqueta opcional; el servicio se muestra destacado.
  badge text,
  sort_order integer not null default 0,
  -- false = no se muestra ni se puede reservar (no se borra, por el historial).
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table barbers (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  -- Nombre que ve el cliente.
  name text not null,
  full_name text,
  role text not null default 'Barbero',
  -- Ruta dentro del sitio (/images/...) o URL de la foto.
  photo_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Horario de cada barbero por día de la semana (0 = domingo … 6 = sábado), en hora de Argentina.
-- Sin fila para un día = ese día no atiende (franco).
create table barber_hours (
  barber_id text not null references barbers (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens time not null,
  closes time not null check (closes > opens),
  primary key (barber_id, weekday)
);

alter table services enable row level security;
alter table barbers enable row level security;
alter table barber_hours enable row level security;

-- Datos actuales (perfil público de AgendaPro, noviembre 2026).
insert into services (id, name, description, includes, price_ars, duration_minutes, badge, sort_order) values
  ('corte', 'Corte de cabello',
   'Con asesoramiento profesional, adaptado a tus rasgos y tu estilo. Incluye lavado premium con productos Schwarzkopf.',
   array['Asesoramiento profesional', 'Lavado premium Schwarzkopf', 'Café de Café Martínez'], 19000, 30, null, 1),
  ('corte-y-barba', 'Corte y barba',
   'Corte de cabello y arreglo de barba con asesoramiento personalizado, vapor facial iónico y lavado premium.',
   array['Corte + arreglo de barba', 'Vapor facial iónico', 'Lavado premium Schwarzkopf', 'Café de Café Martínez'], 24000, 60, 'Servicio completo', 2),
  ('barba-clasica', 'Barba clásica',
   'Perfilado limpio y preciso, con vapor facial iónico y tónicos y aceites que hidratan y ayudan a modelar la barba.',
   array['Perfilado a medida', 'Vapor facial iónico', 'Tónicos y aceites', 'Café de Café Martínez'], 18000, 30, null, 3),
  ('afeitado', 'Afeitado de barba',
   'Afeitado al ras con vapor facial iónico y productos para hidratar, calmar y proteger la piel.',
   array['Afeitado al ras', 'Vapor facial iónico', 'Hidratación de la piel', 'Café de Café Martínez'], 18000, 30, null, 4),
  ('corte-y-afeitado', 'Corte y afeitado',
   'Corte de cabello y afeitado al ras, con asesoramiento personalizado, vapor facial iónico y lavado premium.',
   array['Corte + afeitado al ras', 'Vapor facial iónico', 'Lavado premium Schwarzkopf', 'Café de Café Martínez'], 24000, 60, null, 5)
on conflict (id) do nothing;

insert into barbers (id, name, full_name, role, sort_order) values
  ('franco', 'Franco', 'Franco Rodriguez', 'Barbero', 1),
  ('lisandro', 'Lisandro', 'Lisandro Cacciatori', 'Barbero', 2),
  ('hernan', 'Hernán', 'Hernan Lencina', 'Barbero', 3),
  ('valentin', 'Valentín', 'Valentin Costantino', 'Barbero', 4)
on conflict (id) do nothing;

-- Por ahora todos atienden el horario completo del local:
-- lunes a miércoles 9:30–20:00, jueves a sábado 9:30–20:30, domingo cerrado.
insert into barber_hours (barber_id, weekday, opens, closes)
select b.id, d.weekday, d.opens, d.closes
from barbers b
cross join (values
  (1, time '09:30', time '20:00'),
  (2, time '09:30', time '20:00'),
  (3, time '09:30', time '20:00'),
  (4, time '09:30', time '20:30'),
  (5, time '09:30', time '20:30'),
  (6, time '09:30', time '20:30')
) as d (weekday, opens, closes)
on conflict do nothing;

-- Cada turno apunta a un servicio y a un barbero que existen.
alter table appointments
  add constraint appointments_service_fk foreign key (service_id) references services (id),
  add constraint appointments_barber_fk foreign key (barber_id) references barbers (id);

create index appointments_barber_starts_idx on appointments (barber_id, starts_at);
