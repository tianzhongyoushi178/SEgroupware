-- Add target_audience column to notices table
ALTER TABLE public.notices 
ADD COLUMN IF NOT EXISTS target_audience TEXT[] DEFAULT ARRAY['all'];

-- Comment on column
COMMENT ON COLUMN public.notices.target_audience IS 'Array of target roles or user IDs. Default is ["all"].';
