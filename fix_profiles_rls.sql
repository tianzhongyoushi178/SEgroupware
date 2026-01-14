-- Enable Row Level Security on the table
alter table profiles enable row level security;

-- Drop existing policies to avoid conflicts (optional, but safer for a clean slate if unsure)
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

-- 1. VIEW POLICY (Crucial for Realtime)
-- Allow users to view all profiles (simpler for groupware) or at least their own
create policy "Public profiles are viewable by everyone"
on profiles for select
using ( true );

-- 2. INSERT POLICY
create policy "Users can insert their own profile"
on profiles for insert
with check ( auth.uid() = id );

-- 3. UPDATE POLICY
create policy "Users can update own profile"
on profiles for update
using ( auth.uid() = id );
