
-- Tracked climate actions table
CREATE TABLE public.tracked_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  owner TEXT NOT NULL,
  sector TEXT NOT NULL CHECK (sector IN ('Policy', 'Technology', 'Conservation')),
  deadline DATE NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL DEFAULT 'On Track' CHECK (status IN ('On Track', 'At Risk', 'Behind', 'Completed')),
  impact_gt NUMERIC(5,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Action alerts table
CREATE TABLE public.action_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES public.tracked_actions(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('delay', 'conflict', 'synergy', 'milestone')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracked_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_alerts ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (shared dashboard, no auth)
CREATE POLICY "Public read tracked_actions" ON public.tracked_actions FOR SELECT USING (true);
CREATE POLICY "Public insert tracked_actions" ON public.tracked_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tracked_actions" ON public.tracked_actions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete tracked_actions" ON public.tracked_actions FOR DELETE USING (true);

CREATE POLICY "Public read action_alerts" ON public.action_alerts FOR SELECT USING (true);
CREATE POLICY "Public insert action_alerts" ON public.action_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete action_alerts" ON public.action_alerts FOR DELETE USING (true);

-- Enable realtime for live dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracked_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.action_alerts;
