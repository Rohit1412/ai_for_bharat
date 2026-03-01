
-- Comments on action plans
CREATE TABLE public.plan_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.plan_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comments"
ON public.plan_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create their own comments"
ON public.plan_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.plan_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own or admins can delete"
ON public.plan_comments FOR DELETE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Shared annotations on charts/data
CREATE TABLE public.annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_type TEXT NOT NULL, -- 'metric', 'chart', 'region'
  target_id TEXT NOT NULL,
  content TEXT NOT NULL,
  position_x NUMERIC,
  position_y NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read annotations"
ON public.annotations FOR SELECT
USING (true);

CREATE POLICY "Users can create annotations"
ON public.annotations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own annotations"
ON public.annotations FOR DELETE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Share links for external stakeholder access
CREATE TABLE public.share_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  page TEXT NOT NULL, -- 'dashboard', 'action-plans', 'analytics'
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage share links"
ON public.share_links FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read share links"
ON public.share_links FOR SELECT
USING (true);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.plan_comments;

-- Trigger for updated_at on comments
CREATE TRIGGER update_plan_comments_updated_at
BEFORE UPDATE ON public.plan_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
