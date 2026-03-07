
-- 1. Historical climate metrics time-series
CREATE TABLE public.climate_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('temperature', 'co2', 'methane', 'n2o', 'sea_level', 'renewable_pct')),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  recorded_at DATE NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_climate_metrics_country_type ON public.climate_metrics (country, metric_type, recorded_at);

ALTER TABLE public.climate_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read climate_metrics" ON public.climate_metrics FOR SELECT USING (true);
CREATE POLICY "Public insert climate_metrics" ON public.climate_metrics FOR INSERT WITH CHECK (true);

-- 2. Action comments for collaboration
CREATE TABLE public.action_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES public.tracked_actions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.action_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read action_comments" ON public.action_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated insert action_comments" ON public.action_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.action_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Add assigned_team column to tracked_actions
ALTER TABLE public.tracked_actions ADD COLUMN assigned_team TEXT[] DEFAULT '{}';

-- 4. Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.action_comments;
