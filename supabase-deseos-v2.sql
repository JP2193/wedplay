-- =============================================================
-- Deseos v2 — Moderación + tablero animado
-- Ejecutar en Supabase SQL Editor
-- =============================================================

-- 1. Columna status en wishes
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2. Columna settings en room_modules (para guardar moderation_mode)
ALTER TABLE room_modules ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';

-- 3. RLS: guests solo ven deseos aprobados
DROP POLICY IF EXISTS "guest_wishes_select" ON wishes;
CREATE POLICY "guest_wishes_select" ON wishes FOR SELECT TO anon
  USING (status = 'approved');

-- 4. submit_wish: ahora respeta moderation_mode
CREATE OR REPLACE FUNCTION submit_wish(
  p_room_id    UUID,
  p_guest_name TEXT,
  p_message    TEXT
)
RETURNS wishes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result       wishes;
  mod_settings JSONB;
  mod_mode     TEXT;
  final_status TEXT;
BEGIN
  SELECT settings INTO mod_settings
  FROM room_modules
  WHERE room_id = p_room_id AND module_key = 'deseos';

  mod_mode := COALESCE(mod_settings->>'moderation_mode', 'manual');

  IF mod_mode = 'auto' THEN
    final_status := 'approved';
  ELSE
    final_status := 'pending';
  END IF;

  INSERT INTO wishes (room_id, guest_name, message, status)
  VALUES (p_room_id, p_guest_name, p_message, final_status)
  RETURNING * INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_wish TO anon;

-- 5. approve_wish
CREATE OR REPLACE FUNCTION approve_wish(p_wish_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE wishes SET status = 'approved' WHERE id = p_wish_id;
END;
$$;
GRANT EXECUTE ON FUNCTION approve_wish TO authenticated;

-- 6. reject_wish
CREATE OR REPLACE FUNCTION reject_wish(p_wish_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE wishes SET status = 'rejected' WHERE id = p_wish_id;
END;
$$;
GRANT EXECUTE ON FUNCTION reject_wish TO authenticated;

-- 7. approve_all_wishes
CREATE OR REPLACE FUNCTION approve_all_wishes(p_room_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE wishes SET status = 'approved'
  WHERE room_id = p_room_id AND status = 'pending';
END;
$$;
GRANT EXECUTE ON FUNCTION approve_all_wishes TO authenticated;

-- 8. reset_wishes
CREATE OR REPLACE FUNCTION reset_wishes(p_room_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM wishes WHERE room_id = p_room_id;
END;
$$;
GRANT EXECUTE ON FUNCTION reset_wishes TO authenticated;

-- Verificación
SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE tablename = 'wishes' ORDER BY cmd;
