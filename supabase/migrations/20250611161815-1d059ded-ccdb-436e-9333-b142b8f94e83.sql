
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  chat_name TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own chat history
CREATE POLICY "Users can view their own chat history" ON chat_history
FOR SELECT USING (user_id = auth.uid()::text);

-- Policy to allow users to insert their own chat history
CREATE POLICY "Users can insert their own chat history" ON chat_history
FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Policy to allow users to update their own chat history
CREATE POLICY "Users can update their own chat history" ON chat_history
FOR UPDATE USING (user_id = auth.uid()::text);

-- Policy to allow users to delete their own chat history
CREATE POLICY "Users can delete their own chat history" ON chat_history
FOR DELETE USING (user_id = auth.uid()::text);

-- Add index for better performance
CREATE INDEX idx_chat_history_user_client ON chat_history(user_id, client_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);
