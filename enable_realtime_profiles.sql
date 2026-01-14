-- Enable Realtime for profiles table
begin;
  -- Check if publication exists, if not create it (usually it exists by default)
  -- This part depends on Supabase setup, normally 'supabase_realtime' exists.
  
  -- Add profiles table to publication
  alter publication supabase_realtime add table profiles;
commit;
