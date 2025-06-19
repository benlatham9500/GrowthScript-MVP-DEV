
-- Rename the client_embeddings table to project_profile
ALTER TABLE public.client_embeddings RENAME TO project_profile;

-- Drop the content column from the renamed table
ALTER TABLE public.project_profile DROP COLUMN content;
