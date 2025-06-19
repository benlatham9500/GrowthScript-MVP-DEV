
-- Create the frameworks table
CREATE TABLE public.frameworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  summary TEXT,
  use_when TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  example TEXT,
  keywords JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  related_frameworks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.frameworks ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to read frameworks (public data)
CREATE POLICY "Anyone can view frameworks" 
  ON public.frameworks 
  FOR SELECT 
  USING (true);

-- Insert the AIDA framework data
INSERT INTO public.frameworks (
  title,
  author,
  summary,
  use_when,
  tags,
  example,
  keywords,
  category,
  related_frameworks
) VALUES (
  'AIDA',
  'GrowthScript',
  'Attention → Interest → Desire → Action
Use for ads, landing pages, and sales copy.',
  '',
  '["attention", "banned", "countries"]'::jsonb,
  'Attention: "This new supplement was banned in 3 countries." Interest: "Why? Because it actually works." Desire: "Used by Olympic athletes to recover faster." Action: "Try it free for 7 days."',
  '["desire", "attention", "action", "countries", "banned"]'::jsonb,
  'Growth Framework',
  '["The Power of Intensification", "Pattern interrupt\n2. Big promise\n3. Social proof\n4. Offer\n5. CTA", "Pattern interrupt\n2. Big promise\n3. Social proof\n4. Offer\n5. CTA", "Loss Aversion Framing", "Visual Contrast Guides Focus"]'::jsonb
);
