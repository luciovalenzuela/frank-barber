-- La tabla interna de migraciones tampoco tiene que quedar expuesta por la API de Supabase.
alter table _migrations enable row level security;
