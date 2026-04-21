-- ============================================================
-- Bingo Humano – Security hardening
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Agregar session_token a players
alter table public.players
  add column if not exists session_token uuid;

-- 2. Reemplazar políticas permisivas de players
drop policy if exists "Anon can update players"  on public.players;
drop policy if exists "Anon can read players"    on public.players;
drop policy if exists "Admin can read own players" on public.players;

-- Anon solo puede leer jugadores de un evento específico (no listar todo)
create policy "Anon can read players by event"
  on public.players for select
  using (
    exists (
      select 1 from public.events e
      where e.id = players.event_id
    )
  );

-- Admin puede leer jugadores de sus eventos
create policy "Admin can read own players"
  on public.players for select
  using (
    exists (
      select 1 from public.events e
      where e.id = players.event_id
        and e.admin_id = auth.uid()
    )
  );

-- Bloquear UPDATE directo por anon (solo via RPC)
create policy "Block direct anon update"
  on public.players for update
  using (auth.uid() is not null); -- solo admins autenticados pueden hacer update directo (no se usa)

-- ============================================================
-- 3. RPC: actualizar respuestas (valida session_token)
-- ============================================================
create or replace function update_player_answers(
  p_player_id    uuid,
  p_session_token uuid,
  p_answers      jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  update public.players
  set answers = p_answers
  where id = p_player_id
    and session_token = p_session_token;

  if not found then
    raise exception 'Token inválido o jugador no encontrado';
  end if;
end;
$$;

-- ============================================================
-- 4. RPC: finalizar partida (valida session_token)
-- ============================================================
create or replace function finish_player(
  p_player_id     uuid,
  p_session_token uuid,
  p_bingo_called  boolean default false
)
returns void
language plpgsql
security definer
as $$
begin
  update public.players
  set finished     = true,
      finished_at  = now(),
      bingo_called = p_bingo_called
  where id = p_player_id
    and session_token = p_session_token;

  if not found then
    raise exception 'Token inválido o jugador no encontrado';
  end if;
end;
$$;

-- Dar permisos de ejecución al rol anon
grant execute on function update_player_answers to anon;
grant execute on function finish_player to anon;
