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

## ビルド & デプロイ

- 本番ビルド: `npm run build`
- Vercel Hobbyプランでのデプロイを想定。環境変数をセットすればSupabaseと連携します。
- PWAアイコンは `public/icons` を差し替え、`manifest.json` を更新してください。

## テスト/リンティング

- `npm run lint` : Next.js + ESLintのチェック

## ライセンス

MIT
