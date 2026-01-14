-- Add pinned_by column to threads table to track who made the announcement
ALTER TABLE public.threads
ADD COLUMN IF NOT EXISTS pinned_by uuid REFERENCES auth.users(id);

-- Update existing records? 
-- We can't know who pinned them historically, so we might leave them null 
-- or default to created_by if we want to allow thread creators to unpin legacy ones.
-- For safety, let's leave valid existing pins as is (null pinned_by).
-- The UI logic should handle null pinned_by (e.g., fallback to thread creator or admin).
