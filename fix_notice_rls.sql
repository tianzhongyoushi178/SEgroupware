-- Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Drop existing potentially conflicting policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.notices; -- Retain if needed, but we focus on SELECT
DROP POLICY IF EXISTS "Enable update for authors" ON public.notices;
DROP POLICY IF EXISTS "Enable delete for authors" ON public.notices;
DROP POLICY IF EXISTS "notices_select_policy" ON public.notices;

-- 1. SELECT Policy
CREATE POLICY "notices_select_policy" ON public.notices
FOR SELECT
TO authenticated
USING (
  -- Public notices
  'all' = ANY(target_audience)
  OR
  -- Author can always see
  author_id = auth.uid()
  OR
  -- Targeted to specific user
  ('user:' || auth.uid()) = ANY(target_audience)
  OR
  -- Targeted to admin (and user is admin) OR user is admin and wants to see everything?
  -- Let's allow admins to see everything for simplicity and moderation
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 2. INSERT Policy (Authenticated users can create notices)
-- Note: You might want to restrict 'system' category or 'all' audience to admins?
-- For now, allow authenticated users to insert.
CREATE POLICY "notices_insert_policy" ON public.notices
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
);

-- 3. UPDATE Policy (Authors and Admins)
CREATE POLICY "notices_update_policy" ON public.notices
FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. DELETE Policy (Authors and Admins)
CREATE POLICY "notices_delete_policy" ON public.notices
FOR DELETE
TO authenticated
USING (
  author_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
