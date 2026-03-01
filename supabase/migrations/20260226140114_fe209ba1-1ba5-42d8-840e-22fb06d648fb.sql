
-- Table for storing NOAA gridded temperature anomaly data
CREATE TABLE public.noaa_temperature_grid (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  anomaly numeric NOT NULL,
  rank integer,
  month integer NOT NULL,
  year integer NOT NULL,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(latitude, longitude, month, year)
);

-- Enable RLS
ALTER TABLE public.noaa_temperature_grid ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Authenticated users can read NOAA grid data"
ON public.noaa_temperature_grid FOR SELECT
USING (true);

-- Service role inserts via edge function (no user-level insert needed)
-- We'll use service role key in the edge function

-- Index for fast queries by month/year
CREATE INDEX idx_noaa_grid_month_year ON public.noaa_temperature_grid (year, month);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.noaa_temperature_grid;
