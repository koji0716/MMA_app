export default function StatsPage() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">統計</h1>
      <p className="text-sm text-muted-foreground">
        週/月のボリューム、偏り、復習期限、目標進捗をここに表示します。実際のデータ同期は今後の Supabase
        連携で拡張予定です。
      </p>
    </div>
  );
}
