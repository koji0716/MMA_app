"use client";

import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DS } from "@/lib/datastore";

const TYPES = ["striking", "wrestling", "grappling", "tactics"] as const;

type SessionType = (typeof TYPES)[number];

export default function QuickLogPage() {
  const router = useRouter();
  const [date] = useState(dayjs().format("YYYY-MM-DD"));
  const [startTime] = useState(dayjs().format("HH:mm"));
  const [type, setType] = useState<SessionType>("wrestling");
  const [durationMin, setDurationMin] = useState<number>(60);
  const [tags, setTags] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit() {
    setSaving(true);
    try {
      const body = {
        date,
        startTime,
        type,
        durationMin,
        tags: tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 3),
        memo: memo || undefined,
      };
      await DS.addSession(body);
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>クイック記録</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>日付</Label>
              <Input value={date} readOnly />
            </div>
            <div>
              <Label>開始時刻</Label>
              <Input value={startTime} readOnly />
            </div>
          </div>

          <div>
            <Label>種別</Label>
            <Select value={type} onValueChange={(value) => setType(value as SessionType)}>
              <SelectTrigger className="hidden" />
              <SelectValue />
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
            <Label>時間(分)</Label>
            <Input
              type="number"
              min={1}
              value={durationMin}
              onChange={(event) => setDurationMin(parseInt(event.target.value || "0", 10))}
            />
          </div>

          <div>
            <Label>技術タグ（カンマ区切り / 最大3）</Label>
            <Input
              placeholder="double_leg, knee_slide_pass"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
          </div>

          <div>
            <Label>メモ（任意）</Label>
            <Textarea rows={3} value={memo} onChange={(event) => setMemo(event.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Button disabled={saving} onClick={onSubmit}>
              保存
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
