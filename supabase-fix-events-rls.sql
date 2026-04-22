-- =============================================================
-- Fix: RLS de tablas de juegos (events, quiz_events, adivina_events)
-- Ejecutar en Supabase SQL Editor
-- =============================================================

-- 1. Habilitar RLS en las tres tablas de juego
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE adivina_events ENABLE ROW LEVEL SECURITY;

-- 2. Borrar policies existentes (para evitar conflictos)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='events'
  LOOP EXECUTE format('DROP POLICY %I ON events', r.policyname); END LOOP;
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='quiz_events'
  LOOP EXECUTE format('DROP POLICY %I ON quiz_events', r.policyname); END LOOP;
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='adivina_events'
  LOOP EXECUTE format('DROP POLICY %I ON adivina_events', r.policyname); END LOOP;
END $$;

-- 3. Events: admin puede hacer todo sobre sus eventos, guest puede leer
CREATE POLICY "admin_events_all" ON events
  FOR ALL TO authenticated
  USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "guest_events_read" ON events
  FOR SELECT TO anon USING (true);

-- 4. Quiz events
CREATE POLICY "admin_quiz_events_all" ON quiz_events
  FOR ALL TO authenticated
  USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "guest_quiz_events_read" ON quiz_events
  FOR SELECT TO anon USING (true);

-- 5. Adivina events
CREATE POLICY "admin_adivina_events_all" ON adivina_events
  FOR ALL TO authenticated
  USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "guest_adivina_events_read" ON adivina_events
  FOR SELECT TO anon USING (true);

-- Verificación: debería mostrar las nuevas policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('events', 'quiz_events', 'adivina_events')
ORDER BY tablename, cmd;
