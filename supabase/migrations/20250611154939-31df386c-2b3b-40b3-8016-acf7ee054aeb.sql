
-- Enable the vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  client_name TEXT NOT NULL,
  industry TEXT,
  audience TEXT,
  product_types TEXT,
  brand_tone_notes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_embeddings table for vector storage
CREATE TABLE public.client_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) for clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients
CREATE POLICY "Users can view their own clients" 
  ON public.clients 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" 
  ON public.clients 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
  ON public.clients 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
  ON public.clients 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add Row Level Security (RLS) for client_embeddings table
ALTER TABLE public.client_embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_embeddings
CREATE POLICY "Users can view embeddings for their clients" 
  ON public.client_embeddings 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = client_embeddings.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create embeddings for their clients" 
  ON public.client_embeddings 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = client_embeddings.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update embeddings for their clients" 
  ON public.client_embeddings 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = client_embeddings.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete embeddings for their clients" 
  ON public.client_embeddings 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = client_embeddings.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Create an index for vector similarity search
CREATE INDEX ON public.client_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
