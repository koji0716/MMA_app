"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DS } from "@/lib/datastore";

const TYPE_LABELS: Record<string, string> = {
  striking: "打撃",
  wrestling: "レスリング",
  grappling: "グラップリング",
  tactics: "戦術",
};

type Session = Awaited<ReturnType<typeof DS.listSessions>> extends Array<infer T> ? T : never;

export default function LogListPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    DS.listSessions()
      .then((data) => {
        if (!active) return;
        setSessions(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        if (!active) return;
        setError("ログの読み込みに失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const dateA = dayjs(`${a.date} ${a.startTime ?? "00:00"}`);
      const dateB = dayjs(`${b.date} ${b.startTime ?? "00:00"}`);
      return dateB.valueOf() - dateA.valueOf();
    });
  }, [sessions]);

  const totalDuration = useMemo(() => {
    return sessions.reduce((total, session) => total + session.durationMin, 0);
  }, [sessions]);

  const typeSummary = useMemo(() => {
    const monthSet = new Set<string>();
    const totals: Record<string, number> = {};
    const monthly: Record<string, Record<string, number>> = {};

    sessions.forEach((session) => {
      const month = dayjs(session.date).format("YYYY-MM");
      monthSet.add(month);
      const type = session.type;
      totals[type] = (totals[type] ?? 0) + session.durationMin;
      if (!monthly[type]) {
        monthly[type] = {};
      }
      monthly[type][month] = (monthly[type][month] ?? 0) + session.durationMin;
    });

    const baseOrder = Object.keys(TYPE_LABELS);
    const dataTypes = Array.from(new Set(sessions.map((session) => session.type)));
    const typeOrder = [...baseOrder, ...dataTypes.filter((type) => !baseOrder.includes(type))];
    typeOrder.forEach((type) => {
      totals[type] = totals[type] ?? 0;
      monthly[type] = monthly[type] ?? {};
    });

    const months = Array.from(monthSet).sort(
      (a, b) => dayjs(`${b}-01`).valueOf() - dayjs(`${a}-01`).valueOf(),
    );

    return { typeOrder, totals, monthly, months };
  }, [sessions]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat("ja-JP"), []);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">練習ログ</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            再読み込み
          </Button>
          <Button asChild>
            <Link href="/log/quick">＋ ログする</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>記録一覧</CardTitle>
          <p className="text-sm text-muted-foreground">
            合計 {sessions.length} 件 / {totalDuration} 分
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">読み込み中…</div>
          ) : error ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : sortedSessions.length === 0 ? (
            <div className="text-sm text-muted-foreground">まだ記録がありません。</div>
          ) : (
            <div className="space-y-3">
              {sortedSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>種別ごとの練習時間</CardTitle>
          <p className="text-sm text-muted-foreground">
            種別別の合計時間と月ごとの内訳を確認できます。
          </p>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-sm text-muted-foreground">まだ集計できる記録がありません。</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-medium">種別</th>
                    <th className="px-3 py-2 text-right font-medium">合計(分)</th>
                    {typeSummary.months.map((month) => (
                      <th key={month} className="px-3 py-2 text-right font-medium">
                        {dayjs(`${month}-01`).format("YYYY/MM")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {typeSummary.typeOrder.map((type) => (
                    <tr key={type} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2">{TYPE_LABELS[type] ?? type}</td>
                      <td className="px-3 py-2 text-right">
                        {numberFormatter.format(typeSummary.totals[type] ?? 0)}
                      </td>
                      {typeSummary.months.map((month) => (
                        <td key={month} className="px-3 py-2 text-right">
                          {numberFormatter.format(typeSummary.monthly[type]?.[month] ?? 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const dateTime = session.startTime
    ? dayjs(`${session.date} ${session.startTime}`)
    : dayjs(session.date);
  const dateLabel = session.startTime
    ? dateTime.format("YYYY/MM/DD HH:mm")
    : dateTime.format("YYYY/MM/DD");

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium text-muted-foreground">{dateLabel}</div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Badge>{TYPE_LABELS[session.type] ?? session.type}</Badge>
            <span>{session.durationMin} 分</span>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/log/${session.id}/edit`}>編集</Link>
          </Button>
        </div>
      </div>

      {session.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {session.tags.map((tag, index) => (
            <Badge key={`${session.id}-tag-${index}`} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      ) : null}

      {session.memo ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{session.memo}</p>
      ) : null}

      {session.syncState !== "synced" ? (
        <div className="text-xs text-amber-600">
          {session.syncState === "pending" ? "同期待ち" : "同期エラー"}
        </div>
      ) : null}
    </div>
  );
}
