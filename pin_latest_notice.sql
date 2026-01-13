-- 最新のお知らせ1件を「固定（pinned）」状態にします
UPDATE public.notices 
SET is_pinned = true 
WHERE id = (
    SELECT id 
    FROM public.notices 
    ORDER BY created_at DESC 
    LIMIT 1
);
