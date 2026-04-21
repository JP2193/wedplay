-- =============================================================
-- WedPlay: Nuevo schema con sistema de Cuartos (Rooms)
-- Ejecutar en Supabase SQL Editor
-- ATENCIÓN: Este script elimina datos existentes
-- =============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. LIMPIEZA (orden inverso por dependencias)
-- ──────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS timeline_moments CASCADE;
DROP TABLE IF EXISTS wishes CASCADE;
DROP TABLE IF EXISTS room_modules CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- Limpiar tablas de juegos existentes (datos viejos)
TRUNCATE TABLE players CASCADE;
TRUNCATE TABLE questions CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE quiz_players CASCADE;
TRUNCATE TABLE quiz_questions CASCADE;
TRUNCATE TABLE quiz_events CASCADE;
TRUNCATE TABLE adivina_players CASCADE;
TRUNCATE TABLE adivina_questions CASCADE;
TRUNCATE TABLE adivina_events CASCADE;

-- ──────────────────────────────────────────────────────────────
-- 2. AGREGAR room_id A TABLAS EXISTENTES (si no existe)
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='room_id') THEN
    ALTER TABLE events ADD COLUMN room_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quiz_events' AND column_name='room_id') THEN
    ALTER TABLE quiz_events ADD COLUMN room_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='adivina_events' AND column_name='room_id') THEN
    ALTER TABLE adivina_events ADD COLUMN room_id UUID;
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 3. TABLA: rooms (un cuarto por admin)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code         CHAR(6) NOT NULL UNIQUE,
  event_name   TEXT NOT NULL DEFAULT '',
  event_date   DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(admin_id)
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Admin puede ver/editar su propio cuarto
CREATE POLICY "Admin puede ver su cuarto"
  ON rooms FOR SELECT
  USING (auth.uid() = admin_id);

CREATE POLICY "Admin puede actualizar su cuarto"
  ON rooms FOR UPDATE
  USING (auth.uid() = admin_id);

CREATE POLICY "Admin puede crear su cuarto"
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

-- Cualquiera (guest anon) puede leer por código
CREATE POLICY "Guest puede leer cuarto por codigo"
  ON rooms FOR SELECT
  TO anon
  USING (true);

-- ──────────────────────────────────────────────────────────────
-- 4. TABLA: room_modules (módulos por cuarto)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE room_modules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id             UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  module_key          TEXT NOT NULL,  -- 'bingo' | 'quiz' | 'adivina' | 'deseos' | 'timeline' | 'lightning' | 'playlist'
  is_visible          BOOLEAN NOT NULL DEFAULT FALSE,
  is_enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_enable_at TIMESTAMPTZ,   -- futuro: activación automática por horario
  UNIQUE(room_id, module_key)
);

ALTER TABLE room_modules ENABLE ROW LEVEL SECURITY;

-- Admin puede gestionar los módulos de su cuarto
CREATE POLICY "Admin puede ver modulos de su cuarto"
  ON room_modules FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_modules.room_id AND rooms.admin_id = auth.uid())
  );

CREATE POLICY "Admin puede actualizar modulos de su cuarto"
  ON room_modules FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_modules.room_id AND rooms.admin_id = auth.uid())
  );

CREATE POLICY "Admin puede insertar modulos en su cuarto"
  ON room_modules FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_modules.room_id AND rooms.admin_id = auth.uid())
  );

-- Guests pueden leer módulos (para ver cuáles están habilitados)
CREATE POLICY "Guest puede leer modulos"
  ON room_modules FOR SELECT
  TO anon
  USING (true);

-- ──────────────────────────────────────────────────────────────
-- 5. TABLA: wishes (módulo Deseos)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE wishes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  guest_name  TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- Guests pueden insertar deseos
CREATE POLICY "Guest puede insertar deseo"
  ON wishes FOR INSERT
  TO anon
  WITH CHECK (true);

-- Guests pueden leer deseos (para ver los de los demás)
CREATE POLICY "Guest puede leer deseos"
  ON wishes FOR SELECT
  TO anon
  USING (true);

-- Admin puede ver y eliminar deseos de su cuarto
CREATE POLICY "Admin puede ver deseos de su cuarto"
  ON wishes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = wishes.room_id AND rooms.admin_id = auth.uid())
  );

CREATE POLICY "Admin puede eliminar deseos de su cuarto"
  ON wishes FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = wishes.room_id AND rooms.admin_id = auth.uid())
  );

-- ──────────────────────────────────────────────────────────────
-- 6. TABLA: timeline_moments (módulo Timeline)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE timeline_moments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  moment_date DATE,
  title       TEXT NOT NULL,
  description TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE timeline_moments ENABLE ROW LEVEL SECURITY;

-- Admin puede CRUD momentos de su cuarto
CREATE POLICY "Admin puede gestionar momentos de su cuarto"
  ON timeline_moments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = timeline_moments.room_id AND rooms.admin_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = timeline_moments.room_id AND rooms.admin_id = auth.uid())
  );

-- Guests pueden leer momentos
CREATE POLICY "Guest puede leer momentos"
  ON timeline_moments FOR SELECT
  TO anon
  USING (true);

-- ──────────────────────────────────────────────────────────────
-- 7. FK de juegos existentes → rooms
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- events → rooms
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'events_room_id_fkey'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_room_id_fkey
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;
  END IF;

  -- quiz_events → rooms
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'quiz_events_room_id_fkey'
  ) THEN
    ALTER TABLE quiz_events
      ADD CONSTRAINT quiz_events_room_id_fkey
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;
  END IF;

  -- adivina_events → rooms
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'adivina_events_room_id_fkey'
  ) THEN
    ALTER TABLE adivina_events
      ADD CONSTRAINT adivina_events_room_id_fkey
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 8. Habilitar Realtime en nuevas tablas
-- ──────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE room_modules;
ALTER PUBLICATION supabase_realtime ADD TABLE wishes;

-- ──────────────────────────────────────────────────────────────
-- Verificación
-- ──────────────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
