"use client";

import Link from "next/link";
import dayjs from "dayjs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionRecord } from "@/lib/datastore/local";

export type Session = SessionRecord;

export const SESSION_TYPE_LABELS: Record<string, string> = {
  striking: "打撃",
  wrestling: "レスリング",
  grappling: "グラップリング",
  tactics: "戦術",
};

export function SessionCard({ session }: { session: Session }) {
  const dateTime = session.startTime ? dayjs(`${session.date} ${session.startTime}`) : dayjs(session.date);
  const dateLabel = session.startTime ? dateTime.format("YYYY/MM/DD HH:mm") : dateTime.format("YYYY/MM/DD");

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium text-muted-foreground">{dateLabel}</div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Badge>{SESSION_TYPE_LABELS[session.type] ?? session.type}</Badge>
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
