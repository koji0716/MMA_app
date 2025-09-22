"use client";

import dayjs from "dayjs";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DS } from "@/lib/datastore";
import { useAuth } from "@/components/providers/auth-provider";

type Session = Awaited<ReturnType<typeof DS.getSession>>;

const TYPES = ["striking", "wrestling", "grappling", "tactics"] as const;

type SessionType = (typeof TYPES)[number];

export default function EditLogPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logSession, setLogSession] = useState<Session | null>(null);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [type, setType] = useState<SessionType>("wrestling");
  const [durationMin, setDurationMin] = useState<number>(60);
  const [tags, setTags] = useState("");
  const [memo, setMemo] = useState("");
  const {
    session: authSession,
    loading: authLoading,
    supabaseAvailable,
  } = useAuth();

  const loginRequired = supabaseAvailable && !authLoading && !authSession;

  useEffect(() => {
    let active = true;
    if (!sessionId || Array.isArray(sessionId)) {
      setError("ログが見つかりませんでした");
      setLoading(false);
      return;
    }
    setLoading(true);
    DS.getSession(sessionId)
      .then((data) => {
        if (!active) return;
        if (!data) {
          setError("ログが見つかりませんでした");
          return;
        }
        setLogSession(data);
        setError(null);
        setDate(data.date);
        setStartTime(data.startTime ?? "");
        const nextType = TYPES.includes(data.type as SessionType)
          ? (data.type as SessionType)
          : "wrestling";
        setType(nextType);
        setDurationMin(data.durationMin);
        setTags(data.tags?.join(",") ?? "");
        setMemo(data.memo ?? "");
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
  }, [sessionId]);

  const formattedCreatedAt = useMemo(() => {
    if (!logSession?.createdAt) return null;
    return dayjs(logSession.createdAt).format("YYYY/MM/DD HH:mm");
  }, [logSession?.createdAt]);

  async function handleSubmit() {
    if (!sessionId || Array.isArray(sessionId)) return;
    setSaving(true);
    try {
      const payload = {
        date,
        startTime: startTime || undefined,
        type,
        durationMin,
        tags: tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 3),
        memo: memo || undefined,
      };
      await DS.updateSession(sessionId, payload);
      router.push("/log");
    } catch (err) {
      console.error(err);
      alert("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!sessionId || Array.isArray(sessionId)) return;
    if (!window.confirm("この練習ログを削除しますか？")) {
      return;
    }
    setDeleting(true);
    try {
      await DS.deleteSession(sessionId);
      router.push("/log");
    } catch (err) {
      console.error(err);
      alert("削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>練習ログを編集</CardTitle>
          {formattedCreatedAt ? (
            <p className="text-xs text-muted-foreground">記録日時: {formattedCreatedAt}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">読み込み中…</div>
          ) : error ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <>
              {loginRequired ? (
                <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  <p>ログインするとこの編集内容が Supabase に同期されます。</p>
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <Link href="/auth">ログインページを開く</Link>
                  </Button>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="date">日付</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="startTime">開始時刻</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>種別</Label>
                <Select value={type} onValueChange={(value) => setType(value as SessionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">時間(分)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={durationMin}
                  onChange={(event) => {
                    const parsed = parseInt(event.target.value, 10);
                    setDurationMin(Number.isNaN(parsed) ? 1 : Math.max(1, parsed));
                  }}
                />
              </div>

              <div>
                <Label htmlFor="tags">技術タグ（カンマ区切り / 最大3）</Label>
                <Input
                  id="tags"
                  placeholder="double_leg, knee_slide_pass"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="memo">メモ（任意）</Label>
                <Textarea
                  id="memo"
                  rows={3}
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Button disabled={saving} onClick={handleSubmit}>
                    更新
                  </Button>
                  <Button variant="outline" onClick={() => router.back()}>
                    戻る
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "削除中..." : "このログを削除"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
