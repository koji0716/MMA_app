"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface LinkItem {
  title: string;
  url: string;
  provider?: string;
  note?: string;
}

export default function LinksPage() {
  const [items, setItems] = useState<LinkItem[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  function addItem() {
    if (!title || !url) return;
    setItems((prev) => [...prev, { title, url, note }]);
    setTitle("");
    setUrl("");
    setNote("");
  }

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>学習リンクを追加</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="タイトル" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input placeholder="https://example.com" value={url} onChange={(event) => setUrl(event.target.value)} />
          <Textarea
            rows={3}
            placeholder="メモやスタート秒など"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <Button onClick={addItem}>追加</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>保存済みリンク</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">保存したリンクはまだありません。</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {items.map((item, index) => (
                <li key={item.url + index} className="rounded-md border border-border p-3">
                  <div className="font-medium">{item.title}</div>
                  <a className="text-xs text-primary underline" href={item.url} target="_blank" rel="noreferrer">
                    {item.url}
                  </a>
                  {item.note && <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
