
CREATE OR REPLACE FUNCTION public.generate_automatic_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_row RECORD;
  alert_count INT := 0;
  results jsonb := '[]'::jsonb;
BEGIN
  -- 1. Behind schedule: deadline passed and not completed
  FOR action_row IN
    SELECT * FROM tracked_actions
    WHERE deadline < CURRENT_DATE AND status != 'Completed'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM action_alerts
      WHERE action_id = action_row.id AND type = 'delay'
        AND created_at > now() - interval '24 hours'
    ) THEN
      INSERT INTO action_alerts (action_id, type, severity, message, recommendation)
      VALUES (
        action_row.id, 'delay', 'critical',
        action_row.title || ' has passed its deadline (' || action_row.deadline || ') at ' || action_row.progress || '% progress.',
        'Immediately review resource allocation and timeline. Consider splitting into smaller deliverables.'
      );
      alert_count := alert_count + 1;
    END IF;
  END LOOP;

  -- 2. Stalled: <25% progress, deadline within 30 days
  FOR action_row IN
    SELECT * FROM tracked_actions
    WHERE progress < 25 AND deadline <= (CURRENT_DATE + interval '30 days')
      AND deadline >= CURRENT_DATE AND status != 'Completed'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM action_alerts
      WHERE action_id = action_row.id AND type = 'delay'
        AND created_at > now() - interval '24 hours'
    ) THEN
      INSERT INTO action_alerts (action_id, type, severity, message, recommendation)
      VALUES (
        action_row.id, 'delay', 'critical',
        action_row.title || ' has only ' || action_row.progress || '% progress with deadline ' || action_row.deadline || ' (stalled).',
        'Escalate to project leadership and conduct emergency review of blockers.'
      );
      alert_count := alert_count + 1;
    END IF;
  END LOOP;

  -- 3. At Risk actions
  FOR action_row IN
    SELECT * FROM tracked_actions WHERE status = 'At Risk'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM action_alerts
      WHERE action_id = action_row.id AND type = 'conflict'
        AND created_at > now() - interval '24 hours'
    ) THEN
      INSERT INTO action_alerts (action_id, type, severity, message, recommendation)
      VALUES (
        action_row.id, 'conflict', 'warning',
        action_row.title || ' is flagged as At Risk at ' || action_row.progress || '% progress.',
        'Monitor closely. Identify top 3 blockers and assign mitigation owners within 48 hours.'
      );
      alert_count := alert_count + 1;
    END IF;
  END LOOP;

  -- 4. Synergy detection
  FOR action_row IN
    SELECT t1.id, t1.title, t1.sector, t2.title AS partner_title
    FROM tracked_actions t1
    JOIN tracked_actions t2 ON t1.sector = t2.sector AND t1.id < t2.id
    WHERE t1.status != 'Completed' AND t2.status != 'Completed'
    LIMIT 5
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM action_alerts
      WHERE action_id = action_row.id AND type = 'synergy'
        AND created_at > now() - interval '72 hours'
    ) THEN
      INSERT INTO action_alerts (action_id, type, severity, message, recommendation)
      VALUES (
        action_row.id, 'synergy', 'info',
        'Potential synergy: "' || action_row.title || '" and "' || action_row.partner_title || '" are both in ' || action_row.sector || '.',
        'Consider coordinating resources or establishing a joint task force.'
      );
      alert_count := alert_count + 1;
    END IF;
  END LOOP;

  results := jsonb_build_object('alerts_generated', alert_count);
  RETURN results;
END;
$$;
