-- =============================================================
-- Deseos patch 1 — RPCs moderación + control propio del guest
-- Ejecutar en Supabase SQL Editor
-- =============================================================

-- 1. delete_wish (admin elimina cualquier deseo)
CREATE OR REPLACE FUNCTION delete_wish(p_wish_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM wishes WHERE id = p_wish_id;
END;
$$;
GRANT EXECUTE ON FUNCTION delete_wish TO authenticated;

-- 2. edit_wish (guest edita su propio deseo, valida por guest_name)
--    Respeta moderation_mode: en auto el deseo queda aprobado, en manual vuelve a pending
CREATE OR REPLACE FUNCTION edit_wish(
  p_wish_id    UUID,
  p_guest_name TEXT,
  p_message    TEXT
)
RETURNS wishes LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result       wishes;
  mod_settings JSONB;
  mod_mode     TEXT;
  new_status   TEXT;
BEGIN
  -- Leer el moderation_mode del room al que pertenece el wish
  SELECT rm.settings INTO mod_settings
  FROM room_modules rm
  JOIN wishes w ON w.room_id = rm.room_id
  WHERE w.id = p_wish_id AND rm.module_key = 'deseos';

  mod_mode   := COALESCE(mod_settings->>'moderation_mode', 'manual');
  new_status := CASE WHEN mod_mode = 'auto' THEN 'approved' ELSE 'pending' END;

  UPDATE wishes
  SET message = p_message, status = new_status
  WHERE id = p_wish_id AND guest_name = p_guest_name
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deseo no encontrado o nombre incorrecto';
  END IF;

  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION edit_wish TO anon;

-- 3. delete_own_wish (guest elimina su propio deseo, valida por guest_name)
CREATE OR REPLACE FUNCTION delete_own_wish(
  p_wish_id    UUID,
  p_guest_name TEXT
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM wishes WHERE id = p_wish_id AND guest_name = p_guest_name;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deseo no encontrado o nombre incorrecto';
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION delete_own_wish TO anon;
