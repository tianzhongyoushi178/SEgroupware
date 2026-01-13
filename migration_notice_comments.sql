-- Create notice_comments table
create table if not exists public.notice_comments (
  id uuid default gen_random_uuid() primary key,
  notice_id uuid references public.notices(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notice_comments enable row level security;

-- Policies
create policy "Comments are viewable by everyone"
  on public.notice_comments for select
  using (true);

create policy "Users can create comments"
  on public.notice_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.notice_comments for delete
  using (auth.uid() = user_id);
