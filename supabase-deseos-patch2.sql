-- =============================================================
-- Deseos patch 2 — display_name ("De parte de")
-- Ejecutar en Supabase SQL Editor
-- =============================================================

-- 1. Nueva columna display_name en wishes
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Rellenar filas existentes con guest_name
UPDATE wishes SET display_name = guest_name WHERE display_name IS NULL;

-- 2. submit_wish — acepta p_display_name opcional (default = p_guest_name)
CREATE OR REPLACE FUNCTION submit_wish(
  p_room_id      UUID,
  p_guest_name   TEXT,
  p_message      TEXT,
  p_display_name TEXT DEFAULT NULL
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

  mod_mode     := COALESCE(mod_settings->>'moderation_mode', 'manual');
  final_status := CASE WHEN mod_mode = 'auto' THEN 'approved' ELSE 'pending' END;

  INSERT INTO wishes (room_id, guest_name, message, status, display_name)
  VALUES (p_room_id, p_guest_name, p_message, final_status,
          COALESCE(NULLIF(TRIM(p_display_name), ''), p_guest_name))
  RETURNING * INTO result;

  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION submit_wish TO anon;

-- 3. edit_wish — acepta p_display_name opcional
CREATE OR REPLACE FUNCTION edit_wish(
  p_wish_id      UUID,
  p_guest_name   TEXT,
  p_message      TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS wishes LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result       wishes;
  mod_settings JSONB;
  mod_mode     TEXT;
  new_status   TEXT;
BEGIN
  SELECT rm.settings INTO mod_settings
  FROM room_modules rm
  JOIN wishes w ON w.room_id = rm.room_id
  WHERE w.id = p_wish_id AND rm.module_key = 'deseos';

  mod_mode   := COALESCE(mod_settings->>'moderation_mode', 'manual');
  new_status := CASE WHEN mod_mode = 'auto' THEN 'approved' ELSE 'pending' END;

  UPDATE wishes
  SET message      = p_message,
      status       = new_status,
      display_name = COALESCE(NULLIF(TRIM(p_display_name), ''), p_guest_name)
  WHERE id = p_wish_id AND guest_name = p_guest_name
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deseo no encontrado o nombre incorrecto';
  END IF;

  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION edit_wish TO anon;
