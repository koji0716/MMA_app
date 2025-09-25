"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input, InputProps } from "@/components/ui/input";
import { cn } from "@/lib/util/cn";
import { DS } from "@/lib/datastore";

function normalizeTag(tag: string) {
  return tag.trim();
}

type TagInputWithSuggestionsProps = Omit<InputProps, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
  maxSuggestions?: number;
};

type SessionForTags = Awaited<ReturnType<typeof DS.listSessions>>[number];

type TagFrequency = {
  tag: string;
  count: number;
};

export function TagInputWithSuggestions({
  value,
  onValueChange,
  className,
  maxSuggestions = 5,
  ...props
}: TagInputWithSuggestionsProps) {
  const [frequencies, setFrequencies] = useState<TagFrequency[]>([]);

  useEffect(() => {
    let active = true;
    DS.listSessions()
      .then((sessions) => {
        if (!active) return;
        const map = new Map<string, number>();
        sessions.forEach((session: SessionForTags) => {
          session.tags?.forEach((tag) => {
            const normalized = normalizeTag(tag);
            if (!normalized) return;
            map.set(normalized, (map.get(normalized) ?? 0) + 1);
          });
        });
        const sorted: TagFrequency[] = Array.from(map.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.tag.localeCompare(b.tag);
          });
        setFrequencies(sorted);
      })
      .catch((error) => {
        console.error("タグ候補の読み込みに失敗しました", error);
      });
    return () => {
      active = false;
    };
  }, []);

  const parsedTokens = useMemo(() => {
    return value
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);
  }, [value]);

  const activeToken = useMemo(() => {
    if (!value) return "";
    const segments = value.split(",");
    if (segments.length === 0) return "";
    return segments[segments.length - 1]?.trim() ?? "";
  }, [value]);

  const suggestions = useMemo(() => {
    const query = activeToken.toLowerCase();
    if (!query) return [];
    const existing = new Set(parsedTokens.map((token) => token.toLowerCase()));
    return frequencies
      .filter((item) => item.tag.toLowerCase().includes(query) && !existing.has(item.tag.toLowerCase()))
      .slice(0, maxSuggestions)
      .map((item) => item.tag);
  }, [activeToken, parsedTokens, frequencies, maxSuggestions]);

  const handleSelect = (tag: string) => {
    const hasTrailingComma = value.trim().endsWith(",");
    const rawSegments = value.split(",");
    const baseTokens = hasTrailingComma
      ? parsedTokens
      : rawSegments
          .slice(0, Math.max(0, rawSegments.length - 1))
          .map((segment) => segment.trim())
          .filter(Boolean);
    const nextTokens = [...baseTokens, tag];
    onValueChange(nextTokens.join(", "));
  };

  return (
    <div className="space-y-2">
      <Input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={className}
        {...props}
      />
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              className={cn(
                "cursor-pointer rounded-full border border-transparent p-0 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              onClick={() => handleSelect(tag)}
            >
              <Badge variant="secondary">#{tag}</Badge>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
