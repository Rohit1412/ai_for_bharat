-- =============================================================
-- Migration: Schema enhancements for requirements coverage
-- Addresses: Req 1.1, 3.4, 4.1, 4.2, 6.1, 6.5, 8.4
-- =============================================================

-- 1. Add deadline + feasibility fields to action_plans (Req 3.4, 4.1)
ALTER TABLE public.action_plans
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS economic_cost TEXT,
  ADD COLUMN IF NOT EXISTS feasibility_score TEXT CHECK (feasibility_score IN ('high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS technical_readiness TEXT CHECK (technical_readiness IN ('ready', 'prototype', 'research')),
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 2. Add recommended_actions + source to alerts (Req 6.5)
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS recommended_actions TEXT[],
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS threshold_type TEXT,
  ADD COLUMN IF NOT EXISTS threshold_value NUMERIC,
  ADD COLUMN IF NOT EXISTS current_value NUMERIC;

-- 3. Climate thresholds configuration table (Req 6.1)
CREATE TABLE IF NOT EXISTS public.climate_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  warning_value NUMERIC NOT NULL,
  critical_value NUMERIC NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  unit TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.climate_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read thresholds"
  ON public.climate_thresholds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage thresholds"
  ON public.climate_thresholds FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default climate thresholds
INSERT INTO public.climate_thresholds (metric_type, warning_value, critical_value, direction, unit, description) VALUES
  ('atmospheric_co2', 420, 450, 'above', 'ppm', 'Atmospheric CO₂ concentration — pre-industrial was 280 ppm'),
  ('global_temp_anomaly', 1.5, 2.0, 'above', '°C', 'Global temperature anomaly above pre-industrial — Paris Agreement limits'),
  ('methane_levels', 1900, 2000, 'above', 'ppb', 'Atmospheric methane concentration'),
  ('sea_level_rise', 4.0, 5.0, 'above', 'mm/yr', 'Annual sea level rise rate');

-- 4. Allow service role to insert alerts for automated threshold monitoring
CREATE POLICY "Service role can insert alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (true);

-- 5. Schedule pg_cron job for automated data fetching (Req 1.1)
-- Runs fetch-climate-data every 6 hours
SELECT cron.schedule(
  'fetch-climate-data-job',
  '0 */6 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/fetch-climate-data',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )$$
);

-- 6. Approval workflow view (Req 8.4)
-- Plans marked requires_approval=true need admin sign-off before becoming 'active'
CREATE OR REPLACE FUNCTION public.enforce_plan_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If plan is being set to 'active' and requires approval but not yet approved
  IF NEW.status = 'active' AND NEW.requires_approval = true AND NEW.approved_by IS NULL THEN
    RAISE EXCEPTION 'This plan requires approval before activation. Set approved_by first.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_plan_approval
  BEFORE UPDATE ON public.action_plans
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION public.enforce_plan_approval();
