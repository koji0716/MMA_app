"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type StoredPolicy = {
  text: string;
  updatedAt: string;
};

const STORAGE_KEY = "monthly-policy";

type SaveState = "idle" | "saved";

export function MonthlyPolicyCard() {
  const [value, setValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const currentMonthKey = useMemo(() => dayjs().format("YYYY-MM"), []);
  const storageKey = `${STORAGE_KEY}:${currentMonthKey}`;
  const monthLabel = useMemo(() => dayjs().format("YYYY年M月"), []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredPolicy;
        setValue(parsed.text ?? "");
        setLastUpdatedAt(parsed.updatedAt ?? null);
      }
    } catch (error) {
      console.error("Failed to load monthly policy", error);
    } finally {
      setLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (saveState === "saved") {
      const timeout = setTimeout(() => {
        setSaveState("idle");
      }, 3000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [saveState]);

  const handleSave = () => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: StoredPolicy = {
      text: value,
      updatedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
      setLastUpdatedAt(payload.updatedAt);
      setSaveState("saved");
    } catch (error) {
      console.error("Failed to save monthly policy", error);
    }
  };

  const isEmpty = !value.trim();
  const lastUpdatedLabel = lastUpdatedAt ? dayjs(lastUpdatedAt).format("YYYY年M月D日 HH:mm") : null;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>{monthLabel} の方針</CardTitle>
        <p className="text-sm text-muted-foreground">
          今月の練習方針や目標を書き留めておきましょう。
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="今月の目標や重点的に取り組みたいことを入力してください"
          rows={5}
          disabled={!loaded}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>{lastUpdatedLabel ? `最終更新: ${lastUpdatedLabel}` : "まだ保存されていません"}</div>
          {saveState === "saved" && !isEmpty ? <div className="text-emerald-600">保存しました</div> : null}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!loaded}>
            保存する
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
