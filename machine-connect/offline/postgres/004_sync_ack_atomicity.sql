-- Make sync acknowledgement + checkpoint update atomic.
-- Safe to run after 003_sync_recovery.sql.

CREATE OR REPLACE FUNCTION offline_confirm_sync(
  p_queue_id bigint,
  p_claim_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE sync_queue
  SET synced = true,
      synced_at = now(),
      claimed_at = NULL,
      claim_id = NULL,
      last_error = NULL
  WHERE id = p_queue_id
    AND claim_id = p_claim_id
    AND synced = false
    AND dead_lettered = false;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE sync_checkpoints
  SET last_success_at = now(),
      last_queue_id = p_queue_id,
      last_error = NULL
  WHERE id = true;

  RETURN true;
END;
$$;
