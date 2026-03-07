
CREATE TABLE public.stakeholder_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  fetched_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stakeholder_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stakeholder cache" ON public.stakeholder_cache FOR SELECT USING (true);
CREATE POLICY "Service can insert stakeholder cache" ON public.stakeholder_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update stakeholder cache" ON public.stakeholder_cache FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Service can delete stakeholder cache" ON public.stakeholder_cache FOR DELETE USING (true);
