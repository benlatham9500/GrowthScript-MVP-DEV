
-- Remove all existing embeddings to start fresh
DELETE FROM public.framework_embeddings;

-- Add a unique constraint to ensure 1:1 relationship between frameworks and embeddings
ALTER TABLE public.framework_embeddings 
ADD CONSTRAINT unique_framework_embedding 
UNIQUE (framework_id);
