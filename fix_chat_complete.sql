-- 1. Ensure 'is_deleted' column exists
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 2. Enable RLS (Important: If you enable this, you need policies for SELECT/INSERT too)
-- For now, let's just ensure the policy exists IF RLS is enabled.
-- Uncomment the next line if RLS is currently disabled and you want to enforce it.
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 3. Add Policy for UPDATE (Logical Deletion)
-- This allows users to update only their own messages
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Optional: Ensure select is public/authenticated
DROP POLICY IF EXISTS "Allow reading all messages" ON messages;
CREATE POLICY "Allow reading all messages" ON messages FOR SELECT USING (true);

-- Optional: Allow proper insert
DROP POLICY IF EXISTS "Allow inserting own messages" ON messages;
CREATE POLICY "Allow inserting own messages" ON messages FOR INSERT WITH CHECK (auth.uid() = author_id);
