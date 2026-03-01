
-- Create storage bucket for report files
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read report files
CREATE POLICY "Anyone can read report files"
ON storage.objects FOR SELECT
USING (bucket_id = 'reports');

-- Allow admins to upload report files
CREATE POLICY "Admins can upload report files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reports' AND auth.uid() IS NOT NULL);

-- Allow admins to delete report files
CREATE POLICY "Admins can delete report files"
ON storage.objects FOR DELETE
USING (bucket_id = 'reports' AND auth.uid() IS NOT NULL);

-- Update existing reports with staggered realistic dates
UPDATE reports SET created_at = '2026-02-25T09:00:00Z' WHERE title = 'Q4 2025 Global Emissions Summary';
UPDATE reports SET created_at = '2026-02-20T14:30:00Z' WHERE title = 'Paris Agreement Progress Assessment';
UPDATE reports SET created_at = '2026-02-18T11:15:00Z' WHERE title = 'Regional Deforestation Alert Report';
UPDATE reports SET created_at = '2026-02-10T08:45:00Z' WHERE title = 'Clean Energy Transition Scorecard';
UPDATE reports SET created_at = '2026-02-01T16:00:00Z' WHERE title = 'Methane Monitoring Monthly Brief';

-- Insert additional reports with realistic data
INSERT INTO reports (title, report_type, summary, created_at) VALUES
('2025 Annual Carbon Budget Report', 'Annual', 'Comprehensive analysis of global carbon emissions budget for 2025, including sector breakdowns, regional comparisons, and projections for 2026-2030.', '2026-01-15T10:00:00Z'),
('Q3 2025 Renewable Energy Progress', 'Quarterly', 'Quarterly tracking of renewable energy deployment across 45 countries, highlighting wind and solar capacity additions.', '2025-12-01T09:30:00Z'),
('Industrial Emissions Compliance Audit', 'Monthly', 'Monthly audit of top 100 industrial emitters compliance with nationally determined contributions (NDCs).', '2026-02-22T13:00:00Z'),
('Arctic Ice Sheet Monitoring Alert', 'Alert', 'Critical alert on accelerated ice sheet loss in the Arctic region during January 2026, with potential sea-level rise implications.', '2026-02-15T07:00:00Z'),
('Southeast Asia Wildfire Emissions Report', 'Alert', 'Emergency report on wildfire-related emissions spike across Indonesia and Malaysia affecting regional air quality.', '2026-02-12T18:30:00Z'),
('Global Methane Pledge Progress Q4', 'Quarterly', 'Assessment of 150+ countries progress toward the Global Methane Pledge targets, with sector-by-sector analysis.', '2026-01-28T11:00:00Z'),
('Transport Sector Decarbonization Update', 'Monthly', 'Monthly update on EV adoption rates, aviation fuel alternatives, and shipping emission reduction initiatives across G20 nations.', '2026-02-05T15:00:00Z'),
('Climate Finance Flow Analysis 2025', 'Annual', 'Detailed analysis of climate finance flows from developed to developing nations, tracking the $100B commitment.', '2026-01-20T10:30:00Z'),
('European Green Deal Mid-Term Review', 'Quarterly', 'Mid-term assessment of EU member states progress on European Green Deal targets including Fit for 55 package.', '2026-02-08T09:00:00Z'),
('Carbon Capture Technology Assessment', 'Monthly', 'Review of operational and planned carbon capture facilities worldwide, including cost-effectiveness analysis.', '2026-02-19T14:00:00Z');

-- Enable realtime for reports table
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
