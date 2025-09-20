# MMA Roadmap PWA

個人のMMAトレーニングを「記録 → 可視化 → 次アクション」へ繋げるプログレッシブWebアプリです。超速ログ、技術ロードマップ、重点ドリルのレコメンド、学習リンク管理を中核に、PWAとしてオフライン記録やインストールにも対応します。

## 主な機能

- **クイックログ**: 日時・種別・時間・タグ・メモを30秒で記録。IndexedDBに保存しオンライン時にSupabaseへ同期します。
- **重点3つレコメンド**: `/api/recommendations` で次回練習の重点技術を取得（現在はモックレスポンス）。
- **技術ロードマップ**: 技術ノードごとに到達度とチェックリストを管理。Drawer（Sheet）で詳細編集。
- **学習リンク管理**: 参考動画や資料のURLを保存。将来的にはSupabaseと連携予定。
- **PWA対応**: `next-pwa` + Service Workerでオフラインキャッシュ、ホーム画面追加をサポート。

## ディレクトリ構成ハイライト

- `src/app/(home)` : ホーム（重点3つ表示）
- `src/app/log/quick` : クイックログフォーム
- `src/app/roadmap` : 技術ロードマップUI
- `src/app/links` : 学習リンク管理
- `src/app/api/recommendations` : レコメンドAPIモック
- `src/lib/datastore` : IndexedDB / Supabase データストア実装
- `src/lib/tags` : タグカタログSeed
- `src/seed/tags` : YAML形式のタグSeed

## 開発手順

1. 依存関係のインストール
   ```bash
   npm install
   ```
2. 開発サーバー起動
   ```bash
   npm run dev
   ```
3. Supabase同期を有効化する場合は `.env.local` などに以下を設定
   ```env
   NEXT_PUBLIC_MODE=supabase
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

### Supabaseテーブルの準備

アプリから同期されるレコードは `public.sessions` テーブルに保存されます。まだテーブルを作成していない場
合は、Supabaseダッシュボードの **SQL Editor** で次のスクリプトを実行してください。

```sql
create table if not exists public.sessions (
  id uuid primary key,
  date date not null,
  start_time time without time zone,
  type text not null,
  duration_min integer not null,
  tags text[] not null default array[]::text[],
  memo text,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade
);

alter table public.sessions enable row level security;

create policy "Users can view their own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);
```

上記のSQLを実行すると、ブラウザで `anon` キーを用いてアクセスした場合でも、本人のセッションデータのみを挿入・閲覧・更新・削除できるようになります。

## ビルド & デプロイ

- 本番ビルド: `npm run build`
- Vercel Hobbyプランでのデプロイを想定。環境変数をセットすればSupabaseと連携します。
- PWAアイコンは `public/icons` を差し替え、`manifest.json` を更新してください。

## Vercel上でのデバッグAPIとログ確認方法

- `main` ブランチには Vercel 上の挙動を診断するためのエンドポイント [`/api/debug_env`](./src/app/api/debug_env/route.ts) が用意されています。
- ブラウザで `https://<デプロイURL>/api/debug_env` を開くと、実際に割り当てられている環境変数の一部や、Next.js が認識しているアプリ内ルート一覧が JSON で表示されます。
- 同じリクエストを実行するとサーバー側でもログが出力されます。Vercel ダッシュボードで以下の手順を辿るとログを確認できます。
  1. [Vercel ダッシュボード](https://vercel.com/)で対象プロジェクトを開き、左メニューの **Deployments** をクリック。
  2. ログを確認したいデプロイ（プレビュー/本番どちらでも可）を選択すると詳細画面が開きます。
  3. 画面上部の **View Logs** → **Functions** タブを選択し、`GET /api/debug_env` など対象リクエストのエントリを開くと `console.log` による出力内容が確認できます。
  4. 同じ画面の **Build Logs** タブではビルド時のログも閲覧できます。ビルドが失敗している場合はこちらにエラーが表示されます。

## テスト/リンティング

- `npm run lint` : Next.js + ESLintのチェック

## ライセンス

MIT
