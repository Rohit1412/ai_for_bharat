
-- 1. Audit logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);

-- 2. Stakeholder-plan junction table
CREATE TABLE public.stakeholder_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stakeholder_id uuid NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  action_plan_id uuid NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(stakeholder_id, action_plan_id)
);

ALTER TABLE public.stakeholder_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stakeholder_plans"
  ON public.stakeholder_plans FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stakeholder_plans"
  ON public.stakeholder_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Enable realtime on alerts and climate_metrics
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.climate_metrics;
