
-- Create framework_embeddings table for vector storage
CREATE TABLE public.framework_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_id UUID REFERENCES public.frameworks(id) ON DELETE CASCADE NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.framework_embeddings ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to read framework embeddings (public data)
CREATE POLICY "Anyone can view framework embeddings" 
  ON public.framework_embeddings 
  FOR SELECT 
  USING (true);

-- Create an index for vector similarity search
CREATE INDEX ON public.framework_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
