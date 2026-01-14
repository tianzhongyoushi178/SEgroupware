-- 1. Ensure preferences column exists (as JSONB)
alter table public.profiles 
add column if not exists preferences jsonb default '{}'::jsonb;

-- 2. Enable Realtime for profiles table (using DO block for error handling)
DO $$
BEGIN
  -- Try to add the table to publication.
  -- This will raise an error if the table is already in the publication, so we catch it.
  alter publication supabase_realtime add table profiles;
EXCEPTION WHEN OTHERS THEN
  -- Ignore duplicate key or other errors indicating it's already added
  RAISE NOTICE 'Table could not be added (might already exist in publication). Error: %', SQLERRM;
END $$;
