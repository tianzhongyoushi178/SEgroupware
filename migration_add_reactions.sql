-- Add reactions column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.messages.reactions IS 'JSONB object storing stamp reactions. Key: stamp_id, Value: array of user_ids';
