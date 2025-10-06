"use client";

import dayjs from "dayjs";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { DS } from "@/lib/datastore";

const TYPE_LABELS: Record<string, string> = {
  striking: "打撃",
  wrestling: "レスリング",
  grappling: "グラップリング",
  tactics: "戦術",
};

type Session = Awaited<ReturnType<typeof DS.listSessions>>[number];

type TagEntry = {
  tag: string;
  sessions: Session[];
  totalDuration: number;
};

export default function TagAnalysisPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagQuery, setTagQuery] = useState("");

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
        setError("タグ情報の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredSessions = useMemo(() => {
    if (typeFilter === "all") {
      return sessions;
    }
    return sessions.filter((session) => session.type === typeFilter);
  }, [sessions, typeFilter]);

  const tagEntries = useMemo(() => {
    const map = new Map<string, Session[]>();
    filteredSessions.forEach((session) => {
      session.tags?.forEach((tag) => {
        const normalized = tag.trim();
        if (!normalized) return;
        if (!map.has(normalized)) {
          map.set(normalized, []);
        }
        map.get(normalized)?.push(session);
      });
    });

    return Array.from(map.entries())
      .map(([tag, list]) => ({
        tag,
        sessions: list.sort((a, b) => {
          const dateA = dayjs(`${a.date} ${a.startTime ?? "00:00"}`);
          const dateB = dayjs(`${b.date} ${b.startTime ?? "00:00"}`);
          return dateB.valueOf() - dateA.valueOf();
        }),
        totalDuration: list.reduce((total, item) => total + item.durationMin, 0),
      }))
      .sort((a, b) => {
        if (b.sessions.length !== a.sessions.length) {
          return b.sessions.length - a.sessions.length;
        }
        if (b.totalDuration !== a.totalDuration) {
          return b.totalDuration - a.totalDuration;
        }
        return a.tag.localeCompare(b.tag);
      });
  }, [filteredSessions]);

  const filteredEntries = useMemo(() => {
    const query = tagQuery.trim().toLowerCase();
    if (!query) {
      return tagEntries;
    }
    return tagEntries.filter((entry) => entry.tag.toLowerCase().includes(query));
  }, [tagEntries, tagQuery]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat("ja-JP"), []);
  const filtersApplied = typeFilter !== "all" || tagQuery.trim() !== "";

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">タグ分析</h1>
          <p className="text-sm text-muted-foreground">
            過去に付与したタグごとに、紐づく練習ログを確認できます。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/log">ログ一覧へ戻る</Link>
          </Button>
          <Button asChild>
            <Link href="/log/quick">＋ ログする</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>タグごとの内訳</CardTitle>
          <p className="text-sm text-muted-foreground">
            タグの利用回数順に並べています。
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 md:items-end">
            <div className="space-y-1">
              <Label htmlFor="type-filter">種別で絞り込む</Label>
              <Select id="type-filter" value={typeFilter} onValueChange={setTypeFilter}>
                <SelectItem value="all">すべて</SelectItem>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="tag-search">タグ名で検索</Label>
              <Input
                id="tag-search"
                placeholder="例: ガード"
                value={tagQuery}
                onChange={(event) => setTagQuery(event.target.value)}
              />
            </div>
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground">読み込み中…</div>
          ) : error ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {filtersApplied ? "条件に合致するタグがありません。" : "まだタグ付きの練習ログがありません。"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <TagCard key={entry.tag} entry={entry} numberFormatter={numberFormatter} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type TagCardProps = {
  entry: TagEntry;
  numberFormatter: Intl.NumberFormat;
};

function TagCard({ entry, numberFormatter }: TagCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">#{entry.tag}</Badge>
          <span className="text-sm text-muted-foreground">
            {entry.sessions.length} 件 / 合計 {numberFormatter.format(entry.totalDuration)} 分
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {entry.sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-md border border-border bg-card/60 p-3 transition hover:border-primary"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {dayjs(session.date).format("YYYY/MM/DD")}
                  {session.startTime ? ` ${session.startTime}` : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  種別: {TYPE_LABELS[session.type] ?? session.type} / {session.durationMin} 分
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/log/${session.id}/edit`}>詳細</Link>
              </Button>
            </div>
            {session.memo ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{session.memo}</p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
