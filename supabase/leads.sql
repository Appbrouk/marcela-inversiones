-- ─────────────────────────────────────────────────────────────
-- Marcela Díaz Inversiones — leads del evaluador de perfil
-- Ejecutar una vez en el SQL Editor del proyecto de Supabase.
--
-- Seguridad — en qué se aparta del imobu_leads de IMOBU:
--
--   IMOBU escribe con SUPABASE_SERVICE_ROLE_KEY, que salta RLS por diseño.
--   Esta base está compartida con la operación de Brouk (usuarios, unidades,
--   contactos, comisiones), así que una service_role en el entorno de un sitio
--   público daría acceso total a todo eso si la variable se filtrara.
--
--   Aquí la función serverless escribe con la clave anon y la única política
--   que existe es de INSERT. Esa credencial no puede leer estos leads ni tocar
--   ninguna otra tabla. Además nunca llega al navegador: la función hace de
--   intermediaria.
--
--   Para LEER los leads: panel de Supabase, o una service_role que viva fuera
--   de este proyecto. Deliberadamente el sitio no puede consultarlos.
--
-- Contiene datos personales y financieros (renta, deudas, morosidades):
-- define un plazo de retención y decláralo en la política de privacidad.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.md_leads (
  id        bigint generated always as identity primary key,
  recibido  timestamptz not null default now(),
  tipo      text not null default 'evaluacion',
  pagina    text,
  datos     jsonb not null check (jsonb_typeof(datos) = 'object' and pg_column_size(datos) < 50000),
  estado    text not null default 'Nuevo' check (estado in ('Nuevo','Contactado','Reunion','Cliente','Descartado')),
  notas     text not null default '' check (length(notas) <= 1000)
);

create index if not exists md_leads_recibido on public.md_leads (recibido desc);

alter table public.md_leads enable row level security;

drop policy if exists "md_leads insercion desde el sitio" on public.md_leads;
create policy "md_leads insercion desde el sitio" on public.md_leads
  for insert to anon with check (true);

-- Permisos al ras: anon solo inserta, y solo estas tres columnas.
revoke all on public.md_leads from anon, authenticated;
grant insert (tipo, pagina, datos) on public.md_leads to anon;
