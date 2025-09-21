"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "loading" | "success" | "error";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setStatus("error");
      setError("Supabase クライアントが利用できません。");
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;

    supabase.auth
      .getSessionFromUrl({ storeSession: true })
      .then(({ error: urlError }) => {
        if (urlError) {
          setStatus("error");
          setError(urlError.message);
          return;
        }
        setStatus("success");
        timeout = setTimeout(() => {
          router.replace("/log");
        }, 1200);
      })
      .catch((unknownError) => {
        console.error("Supabase auth getSessionFromUrl error", unknownError);
        setStatus("error");
        setError("メール確認の処理に失敗しました。");
      });

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>ログイン処理中</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {status === "loading" ? (
            <p>メールのリンクを検証しています…</p>
          ) : status === "success" ? (
            <p>確認が完了しました。まもなく画面が切り替わります。</p>
          ) : (
            <p>{error ?? "エラーが発生しました。再度お試しください。"}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
