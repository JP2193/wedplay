-- =============================================================
-- Deseos patch 1 — RPC delete_wish
-- Ejecutar en Supabase SQL Editor
-- =============================================================

CREATE OR REPLACE FUNCTION delete_wish(p_wish_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM wishes WHERE id = p_wish_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_wish TO authenticated;
