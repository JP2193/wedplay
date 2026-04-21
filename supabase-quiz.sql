-- ============================================================
-- Bingo Humano – Quiz (tipo Kahoot)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- TABLAS
create table public.quiz_events (
  id                      uuid primary key default gen_random_uuid(),
  admin_id                uuid not null references auth.users(id) on delete cascade,
  name                    text not null,
  code                    text not null unique,
  timer_seconds           int not null default 15,
  status                  text not null default 'lobby',
  current_question_index  int not null default 0,
  question_started_at     timestamptz,
  created_at              timestamptz not null default now(),
  constraint quiz_events_status_check check (status in ('lobby','question','ranking','finished'))
);

create table public.quiz_questions (
  id              uuid primary key default gen_random_uuid(),
  quiz_event_id   uuid not null references public.quiz_events(id) on delete cascade,
  text            text not null,
  option_a        text not null,
  option_b        text not null,
  option_c        text not null,
  option_d        text not null,
  correct_option  text not null,
  position        int not null,
  created_at      timestamptz not null default now(),
  constraint quiz_questions_correct_check check (correct_option in ('A','B','C','D'))
);

create table public.quiz_players (
  id              uuid primary key default gen_random_uuid(),
  quiz_event_id   uuid not null references public.quiz_events(id) on delete cascade,
  full_name       text not null,
  session_token   uuid not null,
  total_score     int not null default 0,
  created_at      timestamptz not null default now(),
  unique (quiz_event_id, full_name)
);

create table public.quiz_answers (
  id                uuid primary key default gen_random_uuid(),
  quiz_player_id    uuid not null references public.quiz_players(id) on delete cascade,
  quiz_question_id  uuid not null references public.quiz_questions(id) on delete cascade,
  selected_option   text,
  is_correct        boolean not null default false,
  base_score        int not null default 0,
  speed_bonus       int not null default 0,
  total_score       int not null default 0,
  time_taken_ms     int,
  answered_at       timestamptz not null default now(),
  unique (quiz_player_id, quiz_question_id)
);

-- RLS
alter table public.quiz_events    enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_players   enable row level security;
alter table public.quiz_answers   enable row level security;

-- quiz_events
create policy "Admin manages own quiz events"
  on public.quiz_events for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

create policy "Anon can read quiz events"
  on public.quiz_events for select
  using (true);

-- quiz_questions
create policy "Admin manages own quiz questions"
  on public.quiz_questions for all
  using (exists (
    select 1 from public.quiz_events e
    where e.id = quiz_questions.quiz_event_id and e.admin_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.quiz_events e
    where e.id = quiz_questions.quiz_event_id and e.admin_id = auth.uid()
  ));

create policy "Anon can read quiz questions"
  on public.quiz_questions for select
  using (true);

-- quiz_players
create policy "Anon can insert quiz players"
  on public.quiz_players for insert
  with check (true);

create policy "Anon can read quiz players"
  on public.quiz_players for select
  using (true);

-- quiz_answers
create policy "Anon can read quiz answers"
  on public.quiz_answers for select
  using (true);

create policy "Admin can manage quiz answers"
  on public.quiz_answers for all
  using (exists (
    select 1 from public.quiz_players p
    join public.quiz_events e on e.id = p.quiz_event_id
    where p.id = quiz_answers.quiz_player_id and e.admin_id = auth.uid()
  ));

-- ============================================================
-- RPCs
-- ============================================================

-- submit_quiz_answer: jugador envía respuesta
create or replace function submit_quiz_answer(
  p_player_id       uuid,
  p_session_token   uuid,
  p_question_id     uuid,
  p_selected_option text,
  p_time_taken_ms   int
)
returns jsonb
language plpgsql security definer
as $$
declare
  v_player    quiz_players%rowtype;
  v_question  quiz_questions%rowtype;
  v_event     quiz_events%rowtype;
  v_is_correct boolean;
  v_base      int := 0;
  v_bonus     int := 0;
  v_total     int := 0;
  v_timer_ms  int;
begin
  -- Validar token
  select * into v_player from quiz_players
  where id = p_player_id and session_token = p_session_token;
  if not found then raise exception 'Token inválido'; end if;

  select * into v_question from quiz_questions where id = p_question_id;
  select * into v_event   from quiz_events   where id = v_player.quiz_event_id;

  v_timer_ms := v_event.timer_seconds * 1000;

  -- Sanitizar time_taken_ms
  if p_time_taken_ms < 0 or p_time_taken_ms > (v_timer_ms + 2000) then
    p_time_taken_ms := v_timer_ms;
  end if;

  v_is_correct := (v_question.correct_option = p_selected_option);
  if v_is_correct then
    v_base  := 1000;
    v_bonus := greatest(0, round(500.0 * (v_timer_ms - p_time_taken_ms) / v_timer_ms)::int);
    v_total := v_base + v_bonus;
  end if;

  -- Upsert (primera respuesta gana)
  insert into quiz_answers (
    quiz_player_id, quiz_question_id, selected_option,
    is_correct, base_score, speed_bonus, total_score, time_taken_ms
  ) values (
    p_player_id, p_question_id, p_selected_option,
    v_is_correct, v_base, v_bonus, v_total, p_time_taken_ms
  )
  on conflict (quiz_player_id, quiz_question_id) do nothing;

  -- Solo actualizar score si fue la primera respuesta (affected rows = 1)
  if found then
    update quiz_players
    set total_score = total_score + v_total
    where id = p_player_id and session_token = p_session_token;
  end if;

  return jsonb_build_object(
    'is_correct',     v_is_correct,
    'base_score',     v_base,
    'speed_bonus',    v_bonus,
    'total_score',    v_total,
    'correct_option', v_question.correct_option
  );
end;
$$;

grant execute on function submit_quiz_answer to anon;

-- advance_quiz_state: admin avanza el estado
create or replace function advance_quiz_state(
  p_quiz_event_id  uuid,
  p_new_status     text,
  p_question_index int default null
)
returns void
language plpgsql security definer
as $$
begin
  if not exists (
    select 1 from quiz_events
    where id = p_quiz_event_id and admin_id = auth.uid()
  ) then
    raise exception 'No autorizado';
  end if;

  update quiz_events
  set status                 = p_new_status,
      current_question_index = coalesce(p_question_index, current_question_index),
      question_started_at    = case when p_new_status = 'question' then now() else question_started_at end
  where id = p_quiz_event_id;
end;
$$;

grant execute on function advance_quiz_state to authenticated;

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.quiz_events;
alter publication supabase_realtime add table public.quiz_players;
alter publication supabase_realtime add table public.quiz_answers;
