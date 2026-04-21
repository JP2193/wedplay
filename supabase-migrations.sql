-- ============================================================
-- Bingo Humano – Migrations
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Agregar columnas de modo dinámico a events
alter table public.events
  add column if not exists dynamic_mode boolean not null default false,
  add column if not exists easy_count   int,
  add column if not exists hard_count   int;

-- Agregar columna de dificultad a questions
alter table public.questions
  add column if not exists difficulty text check (difficulty in ('easy', 'hard'));

-- Agregar columna bingo_called a players
alter table public.players
  add column if not exists bingo_called boolean not null default false;
