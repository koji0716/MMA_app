"use client";

import dynamic from "next/dynamic";

const HomePage = dynamic(() => import("./(home)/page"), {
  ssr: false,
  loading: () => <div className="p-6 text-sm text-muted-foreground">読み込み中…</div>,
});

export default function RootPage() {
  return <HomePage />;
}
