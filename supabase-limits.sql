-- ============================================================
-- Bingo Humano – Rate limits via triggers
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Máximo 10 eventos por admin
create or replace function check_events_limit()
returns trigger language plpgsql as $$
begin
  if (
    select count(*) from public.events
    where admin_id = NEW.admin_id
  ) >= 10 then
    raise exception 'Límite alcanzado: máximo 10 eventos por cuenta.';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_events_limit on public.events;
create trigger trg_events_limit
  before insert on public.events
  for each row execute function check_events_limit();

-- 2. Máximo 300 preguntas por evento
create or replace function check_questions_limit()
returns trigger language plpgsql as $$
begin
  if (
    select count(*) from public.questions
    where event_id = NEW.event_id
  ) >= 300 then
    raise exception 'Límite alcanzado: máximo 300 preguntas por evento.';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_questions_limit on public.questions;
create trigger trg_questions_limit
  before insert on public.questions
  for each row execute function check_questions_limit();

-- 3. Máximo 500 jugadores por evento
create or replace function check_players_limit()
returns trigger language plpgsql as $$
begin
  if (
    select count(*) from public.players
    where event_id = NEW.event_id
  ) >= 500 then
    raise exception 'Límite alcanzado: máximo 500 jugadores por evento.';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_players_limit on public.players;
create trigger trg_players_limit
  before insert on public.players
  for each row execute function check_players_limit();
