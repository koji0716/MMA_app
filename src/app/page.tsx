"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionCard, SESSION_TYPE_LABELS, type Session } from "@/components/log/session-card";
import { DS } from "@/lib/datastore";
import { cn } from "@/lib/util/cn";

function createCalendarDays(month: Dayjs) {
  const startOfMonth = month.startOf("month");
  const startOffset = startOfMonth.day();
  const firstDay = startOfMonth.subtract(startOffset, "day");
  return Array.from({ length: 42 }, (_, index) => firstDay.add(index, "day"));
}

function sortSessions(sessions: Session[]) {
  return [...sessions].sort((a, b) => {
    const dateA = dayjs(`${a.date} ${a.startTime ?? "00:00"}`);
    const dateB = dayjs(`${b.date} ${b.startTime ?? "00:00"}`);
    return dateA.valueOf() - dateB.valueOf();
  });
}

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => today.startOf("month"));
  const [selectedDate, setSelectedDate] = useState(() => today.format("YYYY-MM-DD"));

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
  }, []);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Session[]>();
    sessions.forEach((session) => {
      const list = map.get(session.date) ?? [];
      list.push(session);
      map.set(session.date, list);
    });
    for (const [key, list] of map) {
      map.set(key, sortSessions(list));
    }
    return map;
  }, [sessions]);

  const calendarDays = useMemo(() => createCalendarDays(currentMonth), [currentMonth]);

  const selectedSessions = useMemo(
    () => sessionsByDate.get(selectedDate) ?? [],
    [sessionsByDate, selectedDate],
  );
  const selectedDayLabel = dayjs(selectedDate).format("YYYY年M月D日");
  const monthLabel = currentMonth.format("YYYY年M月");
  const reflectionEntries = useMemo(() => {
    const tagCounts = new Map<string, number>();
    selectedSessions.forEach((session) => {
      session.tags?.forEach((tag) => {
        const normalized = typeof tag === "string" ? tag.trim() : "";
        if (!normalized) return;
        tagCounts.set(normalized, (tagCounts.get(normalized) ?? 0) + 1);
      });
    });

    const sortedTags = Array.from(tagCounts.entries()).sort((a, b) => {
      if (a[1] === b[1]) {
        return a[0].localeCompare(b[0]);
      }
      return b[1] - a[1];
    });

    return Array.from({ length: 3 }, (_, index) => {
      const entry = sortedTags[index];
      if (!entry) {
        return {
          id: `placeholder-${index}`,
          title: `#タグ${index + 1}`,
          count: 0,
          hasData: false,
        } as const;
      }
      const [tag, count] = entry;
      return {
        id: tag,
        title: `#${tag}`,
        count,
        hasData: true,
      } as const;
    });
  }, [selectedSessions]);

  useEffect(() => {
    reflectionEntries.forEach((entry) => {
      if (entry.hasData) {
        console.info(`[Reflection] ${selectedDayLabel} ${entry.title}: ${entry.count}件`);
      } else {
        console.info(`[Reflection] ${selectedDayLabel} ${entry.title}: 記録なし`);
      }
    });
  }, [reflectionEntries, selectedDayLabel]);
  const monthlyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    sessions.forEach((session) => {
      if (dayjs(session.date).isSame(currentMonth, "month")) {
        totals[session.type] = (totals[session.type] ?? 0) + session.durationMin;
      }
    });
    return totals;
  }, [sessions, currentMonth]);
  const orderedTypes = useMemo(() => {
    const baseOrder = Object.keys(SESSION_TYPE_LABELS);
    const extra = Object.keys(monthlyTotals).filter((type) => !baseOrder.includes(type));
    return [...baseOrder, ...extra];
  }, [monthlyTotals]);

  const handleSelectDay = (day: Dayjs) => {
    setSelectedDate(day.format("YYYY-MM-DD"));
    setCurrentMonth(day.startOf("month"));
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const next = prev.subtract(1, "month");
      setSelectedDate(next.format("YYYY-MM-DD"));
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const next = prev.add(1, "month");
      setSelectedDate(next.format("YYYY-MM-DD"));
      return next;
    });
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">ホーム</h1>
          <p className="text-sm text-muted-foreground">カレンダーから練習ログを確認できます。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSelectDay(dayjs())}>今日</Button>
          <Button asChild variant="outline">
            <Link href="/log">一覧を見る</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>練習カレンダー</CardTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>{monthLabel}</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                前の月
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                次の月
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {[
              "日",
              "月",
              "火",
              "水",
              "木",
              "金",
              "土",
            ].map((label) => (
              <div key={label} className="py-2">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateKey = day.format("YYYY-MM-DD");
              const isCurrentMonth = day.month() === currentMonth.month();
              const isToday = day.isSame(today, "day");
              const isSelected = dateKey === selectedDate;
              const hasSessions = sessionsByDate.has(dateKey);

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center rounded-md border text-sm transition",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-transparent bg-muted/40 hover:border-border hover:bg-muted",
                    !isCurrentMonth && "text-muted-foreground/60",
                  )}
                >
                  <span className={cn("text-base font-medium", isToday && !isSelected && "text-primary")}>{day.date()}</span>
                  <span className="text-[10px]">
                    {hasSessions ? `${(sessionsByDate.get(dateKey) ?? []).length} 件` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>振り返りログ</CardTitle>
          <p className="text-sm text-muted-foreground">{selectedDayLabel} のタグ別サマリーです。</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">読み込み中…</div>
          ) : (
            <div className="space-y-2">
              {reflectionEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2"
                >
                  <div className="text-sm font-medium">{entry.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.hasData ? `${entry.count} 件` : "記録なし"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>{selectedDayLabel} のログ</CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedSessions.length ? `${selectedSessions.length} 件の記録があります。` : "この日はまだ記録がありません。"}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">読み込み中…</div>
          ) : selectedSessions.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {sessions.length === 0
                ? "まずは右下のボタンから練習を記録してみましょう。"
                : "選択した日に記録はありません。"}
            </div>
          ) : (
            <div className="space-y-3">
              {selectedSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>種別ごとの合計 (今月)</CardTitle>
          <p className="text-sm text-muted-foreground">今月の練習時間をカテゴリ別に確認できます。</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">集計中…</div>
          ) : orderedTypes.length === 0 ? (
            <div className="text-sm text-muted-foreground">まだ今月の記録がありません。</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              {orderedTypes.map((type) => {
                const label = SESSION_TYPE_LABELS[type] ?? type;
                const total = monthlyTotals[type] ?? 0;
                return (
                  <div key={type} className="rounded-md border border-border p-3">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="text-lg font-semibold">{total} 分</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="fixed bottom-4 right-4">
        <Button asChild size="lg">
          <Link href="/log/quick">＋ ログする</Link>
        </Button>
      </div>
    </div>
  );
}
