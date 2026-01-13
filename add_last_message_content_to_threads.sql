-- threadsテーブルにlast_message_contentカラムを追加
ALTER TABLE public.threads 
ADD COLUMN last_message_content TEXT;

COMMENT ON COLUMN public.threads.last_message_content IS 'スレッドの最新メッセージの内容（一覧表示用）';

-- 既存のデータに対して、最新のメッセージ内容で埋める処理
-- 注意: 大量データがある場合は負荷に注意が必要ですが、今回は簡易的なクエリで対応します
UPDATE public.threads t
SET last_message_content = (
    SELECT content 
    FROM public.messages m 
    WHERE m.thread_id = t.id 
    ORDER BY m.created_at DESC 
    LIMIT 1
);
