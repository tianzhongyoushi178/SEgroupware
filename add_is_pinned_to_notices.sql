-- noticesテーブルにis_pinnedカラムを追加
ALTER TABLE public.notices 
ADD COLUMN is_pinned BOOLEAN DEFAULT false;

-- カラムへのコメント（固定フラグ：trueの場合、未読のみ表示時でも常に表示される）
COMMENT ON COLUMN public.notices.is_pinned IS 'trueの場合、未読のみ表示時でも常に表示される';
