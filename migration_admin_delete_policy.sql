-- Allow admin to update any message (specifically for soft delete)
-- Access is granted if the user's email matches the hardcoded admin email matches authStore.ts logic

create policy "Admin can update messages"
on public.messages
for update
using (
  (auth.jwt() ->> 'email') = 'tanaka-yuj@seibudenki.co.jp'
);
