"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const STATUS = [
  { key: "not_started", label: "未着手" },
  { key: "understood", label: "理解" },
  { key: "rehearsing", label: "反復" },
  { key: "applied", label: "実戦定着" },
] as const;

type StatusKey = (typeof STATUS)[number]["key"];

interface NodeMeta {
  id: string;
  title: string;
  area: string;
  checklist: string[];
}

export default function RoadmapPage() {
  const nodes = useMemo<NodeMeta[]>(
    () => [
      {
        id: "double_leg",
        title: "Double Leg",
        area: "wrestling",
        checklist: ["レベルチェンジ", "角度変更", "3秒以内の展開", "リセット手順"],
      },
      {
        id: "knee_slide_pass",
        title: "Knee Slide Pass",
        area: "grappling",
        checklist: ["CF固定", "アンダーフック", "膝越え", "ベース維持"],
      },
      {
        id: "jab_cross_low_kick",
        title: "Jab–Cross–Low Kick",
        area: "striking",
        checklist: ["視線固定", "重心外へ", "脛で当てる", "戻し速く"],
      },
    ],
    []
  );

  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node) => (
        <Card key={node.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {node.title} <span className="text-xs text-muted-foreground">({node.area})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {node.checklist.slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-3">
              <Sheet open={openId === node.id} onOpenChange={(open) => setOpenId(open ? node.id : null)}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline">
                    開く
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-xl">
                  <SheetHeader>
                    <SheetTitle>{node.title}</SheetTitle>
                  </SheetHeader>
                  <NodeEditor nodeId={node.id} checklist={node.checklist} />
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NodeEditor({ nodeId, checklist }: { nodeId: string; checklist: string[] }) {
  const [status, setStatus] = useState<StatusKey>("understood");
  const [checks, setChecks] = useState<Record<number, boolean>>({});

  function toggle(index: number) {
    setChecks((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function onSave() {
    console.log("save", { nodeId, status, checks });
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <Label>到達度</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as StatusKey)}>
          <SelectTrigger className="hidden" />
          <SelectValue />
          <SelectContent>
            {STATUS.map((state) => (
              <SelectItem key={state.key} value={state.key}>
                {state.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>チェックリスト</Label>
        <div className="mt-2 space-y-2">
          {checklist.map((item, index) => (
            <label key={item} className="flex items-center gap-2 text-sm">
              <Checkbox checked={!!checks[index]} onChange={() => toggle(index)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave}>
          保存
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setStatus("understood");
            setChecks({});
          }}
        >
          リセット
        </Button>
      </div>
    </div>
  );
}
