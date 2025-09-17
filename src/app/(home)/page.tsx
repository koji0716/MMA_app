"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/util/cn";

interface FocusItem {
  technique_id: string;
  reason: string[];
  drills: string[];
}

interface FocusResp {
  date: string;
  top3: FocusItem[];
  warnings: string[];
  hasSessionTomorrow?: boolean;
}

export default function HomePage() {
  const [data, setData] = useState<FocusResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetch("/api/recommendations?include_links=true", { cache: "no-store" });
        if (!response.ok) throw new Error("failed to fetch");
        const json: FocusResp = await response.json();
        if (mounted) setData(json);
      } catch (error) {
        console.error(error);
        if (mounted) {
          setData({
            date: dayjs().format("YYYY-MM-DD"),
            top3: [
              { technique_id: "double_leg", reason: ["review_due"], drills: ["ペネト3×10", "角度2×3R"] },
              { technique_id: "knee_slide_pass", reason: ["tech_gap"], drills: ["解除→スライド 2×3R"] },
              { technique_id: "jab_cross_low_kick", reason: ["balance_fix"], drills: ["シャドウ3R"] },
            ],
            warnings: [],
            hasSessionTomorrow: false,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">読み込み中…</div>;
  }

  const skipBanner = data?.hasSessionTomorrow === false;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>今日の重点3つ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.top3?.map((item, index) => (
            <div key={item.technique_id + index} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <div className="font-semibold">{index + 1}) {item.technique_id}</div>
                <div className="text-sm text-muted-foreground">理由: {item.reason.join(", ")}</div>
                <div className="text-sm">ドリル: {item.drills.join(" / ")}</div>
              </div>
              <Button asChild size="sm">
                <Link href="/log/quick">開始</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>次の予定</CardTitle>
        </CardHeader>
        <CardContent>
          {skipBanner ? (
            <div className={cn("rounded-md bg-muted p-3 text-sm text-muted-foreground")}>
              明日は練習予定がありません。通知をスキップしました。
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">明日の予定があればここに表示</div>
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
