-- 既存のユーザーのpreferencesにquickAccessOrderが存在しない場合、空の配列で初期化する
-- これにより、データ整合性を保ちます（アプリケーション側でもハンドリングしていますが、念のため）

UPDATE profiles
SET preferences = jsonb_set(coalesce(preferences, '{}'::jsonb), '{quickAccessOrder}', '[]'::jsonb, true)
WHERE preferences->'quickAccessOrder' IS NULL;

-- 確認用クエリ
-- SELECT id, preferences FROM profiles;
