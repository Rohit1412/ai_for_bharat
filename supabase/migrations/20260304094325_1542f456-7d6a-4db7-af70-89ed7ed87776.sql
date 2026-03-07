CREATE TABLE public.weather_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read weather cache"
  ON public.weather_cache FOR SELECT
  TO anon, authenticated
  USING (true);