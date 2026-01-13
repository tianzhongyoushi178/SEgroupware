-- last_message_at が NULL の場合、created_at の値で埋める更新クエリ
UPDATE public.threads 
SET last_message_at = created_at 
WHERE last_message_at IS NULL;
