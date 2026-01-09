-- Create thread_notes table
create table if not exists public.thread_notes (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.threads(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  attachments jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.thread_notes enable row level security;

-- Drop existing policies if they exist to allow re-running
drop policy if exists "Users can view notes in threads they are part of" on public.thread_notes;
drop policy if exists "Users can create notes in threads they are part of" on public.thread_notes;
drop policy if exists "Users can delete their own notes" on public.thread_notes;

-- Policy for viewing notes (same as thread visibility)
create policy "Users can view notes in threads they are part of"
  on public.thread_notes for select
  using (
    exists (
      select 1 from public.thread_participants
      where thread_id = thread_notes.thread_id
      and user_id = auth.uid()
    )
  );

-- Policy for creating notes
create policy "Users can create notes in threads they are part of"
  on public.thread_notes for insert
  with check (
    exists (
      select 1 from public.thread_participants
      where thread_id = thread_notes.thread_id
      and user_id = auth.uid()
    )
  );

-- Policy for deleting own notes
create policy "Users can delete their own notes"
  on public.thread_notes for delete
  using (
    auth.uid() = author_id
  );

-- Ensure attachments column exists (idempotent for existing tables)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'thread_notes' and column_name = 'attachments') then
    alter table public.thread_notes add column attachments jsonb default '[]'::jsonb;
  end if;
end $$;
