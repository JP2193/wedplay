-- ============================================================
-- Bingo Humano – Schema Supabase
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- EVENTS
create table public.events (
  id                  uuid primary key default gen_random_uuid(),
  admin_id            uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  code                text not null unique,
  questions_per_player int not null default 10,
  created_at          timestamptz not null default now()
);

-- QUESTIONS
create table public.questions (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

-- PLAYERS
create table public.players (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references public.events(id) on delete cascade,
  full_name           text not null,
  assigned_questions  jsonb not null default '[]'::jsonb,
  answers             jsonb not null default '{}'::jsonb,
  finished            boolean not null default false,
  finished_at         timestamptz,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.events  enable row level security;
alter table public.questions enable row level security;
alter table public.players  enable row level security;

-- EVENTS: el admin sólo ve y modifica sus propios eventos
create policy "Admin manages own events"
  on public.events
  for all
  using  (admin_id = auth.uid())
  with check (admin_id = auth.uid());

-- QUESTIONS: cualquier usuario autenticado puede leer (para guests) o el admin gestiona las suyas
create policy "Admin manages own questions"
  on public.questions
  for all
  using  (exists (
    select 1 from public.events e
    where e.id = questions.event_id and e.admin_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = questions.event_id and e.admin_id = auth.uid()
  ));

-- Anon puede leer preguntas (para el flujo guest sin login)
create policy "Anon can read questions"
  on public.questions
  for select
  using (true);

-- Anon puede leer eventos (para validar código)
create policy "Anon can read events"
  on public.events
  for select
  using (true);

-- PLAYERS: anon puede crear e insertar sus datos; sólo pueden leer/update su propio registro
-- (identificamos por event_id + full_name, sin auth)
create policy "Anon can insert players"
  on public.players
  for insert
  with check (true);

create policy "Anon can read players"
  on public.players
  for select
  using (true);

create policy "Anon can update players"
  on public.players
  for update
  using (true);

-- Admin puede leer sus jugadores
create policy "Admin can read own players"
  on public.players
  for select
  using (exists (
    select 1 from public.events e
    where e.id = players.event_id and e.admin_id = auth.uid()
  ));

-- ============================================================
-- REALTIME: habilitar para players
-- ============================================================
-- En el dashboard de Supabase: Database → Replication → habilitar "players"
-- O ejecutar:
-- alter publication supabase_realtime add table public.players;
