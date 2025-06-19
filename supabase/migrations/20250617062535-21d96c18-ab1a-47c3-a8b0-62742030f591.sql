
-- Create the memory table
CREATE TABLE public.memory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    user_id uuid NOT NULL,
    key TEXT NOT NULL,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint to link to clients table
ALTER TABLE public.memory 
ADD CONSTRAINT memory_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

-- Add foreign key constraint to link to users table
ALTER TABLE public.memory 
ADD CONSTRAINT memory_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(_id) ON DELETE CASCADE;

-- Add Row Level Security (RLS)
ALTER TABLE public.memory ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own memory records
CREATE POLICY "Users can view their own memory records" 
  ON public.memory 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Create policy that allows users to insert their own memory records
CREATE POLICY "Users can create their own memory records" 
  ON public.memory 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Create policy that allows users to update their own memory records
CREATE POLICY "Users can update their own memory records" 
  ON public.memory 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create policy that allows users to delete their own memory records
CREATE POLICY "Users can delete their own memory records" 
  ON public.memory 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX idx_memory_client_user ON public.memory(client_id, user_id);
CREATE INDEX idx_memory_key ON public.memory(key);
CREATE INDEX idx_memory_updated_at ON public.memory(updated_at);
