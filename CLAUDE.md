# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Sales Hub - 社内グループウェアアプリケーション（Next.js 16 + Supabase）

主要機能:
- ダッシュボード（クイックアクセス、お知らせウィジェット）
- お知らせ管理（既読管理、カテゴリ分類、日付フィルタリング）
- チャット（スレッド承認制、プライベートスレッド、リアルタイム通信）
- AIツール（出張旅費アシスタント、SEナレッジベース、OCRツール）
- 外部リンク集（社内システム連携）

## コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動
npm run lint     # ESLint実行
```

型チェック（グローバルルールに従い、コード変更後に実行）:
```bash
npx tsc --noEmit
```

## アーキテクチャ

### 状態管理（Zustand）
- `authStore` - 認証状態、ユーザープロファイル、チュートリアル完了状態
- `chatStore` - スレッド/メッセージ管理、リアルタイム購読、未読カウント
- `noticeStore` - お知らせCRUD、既読ステータス（JSONBマップ）
- `appSettingsStore` - タブ表示設定、ユーザー権限、サイドバー幅
- `userStore` - ユーザー一覧取得
- `settingsStore` - 設定関連

### データベース（Supabase）
テーブル: `profiles`, `notices`, `threads`, `messages`, `thread_participants`, `user_permissions`

リアルタイム購読パターン:
```typescript
const channel = supabase
  .channel('public:tablename')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tablename' }, callback)
  .subscribe();
```

### 認証
- Supabase Auth使用
- 管理者判定: `user.email === 'tanaka-yuj@seibudenki.co.jp'`
- `AuthGuard`コンポーネントでルート保護

### レイアウト構造
```
RootLayout
├── ErrorBoundary
├── ThemeInitializer
├── AuthGuard
│   ├── Sidebar（リサイズ可能、モバイル対応）
│   ├── MainLayout
│   └── TutorialOverlay
└── Toaster
```

### API Routes
- `/api/chat/route.ts` - チャット（現在無効化）
- `/api/chat/upload/route.ts` - ファイルアップロード
- `/api/chat/read/route.ts` - 既読マーク（RLSバイパス用）
- `/api/chat/help/route.ts` - ヘルプチャットボット

### パスエイリアス
`@/*` → `./src/*`

## 主要な型定義

```typescript
// src/types/user.ts
type UserRole = 'admin' | 'user';
interface UserProfile { uid, email, role, displayName, department?, preferences? }

// src/types/notice.ts
type NoticeCategory = 'system' | 'general' | 'urgent';
interface Notice { id, title, content, category, readStatus: Record<string, string>, startDate?, endDate? }
```

## 開発時の注意点

- 管理者のみスレッド即時作成可能、一般ユーザーは承認待ち
- お知らせの`readStatus`はユーザーIDをキーとしたJSONBマップ
- プライベートスレッドは`thread_participants`テーブルで参加者管理
- サイドバーの未読バッジは`notices`と`threads`の両方から計算
