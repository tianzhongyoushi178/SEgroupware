-- Create notice_flags table
CREATE TABLE IF NOT EXISTS public.notice_flags (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    notice_id UUID REFERENCES public.notices(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, notice_id)
);

-- RLS Policies
ALTER TABLE public.notice_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own flags" ON public.notice_flags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flags" ON public.notice_flags
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can select their own flags" ON public.notice_flags
    FOR SELECT USING (auth.uid() = user_id);
