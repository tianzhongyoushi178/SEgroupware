-- Add start_date and end_date columns to notices table
ALTER TABLE public.notices
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- Allow read access to these columns (if RLS policies exist, though usually column additions don't break RLS unless specific columns are selected)
-- Ensuring policies cover new columns implicitly by selecting *
