"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "loading" | "ready" | "error";

export default function PasswordResetPage() {
  const router = useRouter();
  const { session, supabaseAvailable } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseAvailable || !supabase) {
      setStatus("error");
      setError("Supabase の設定が未完了のため、パスワード再設定を利用できません。");
      return;
    }

    const currentUrl = new URL(window.location.href);
    const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    const hasRecoveryTokens = Boolean(accessToken && refreshToken);

    if (hasRecoveryTokens) {
      const applyRecoverySession = async () => {
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken ?? "",
            refresh_token: refreshToken ?? "",
          });
          if (!sessionError) {
            setStatus("ready");
            window.history.replaceState({}, document.title, currentUrl.pathname);
            return;
          }
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setStatus("ready");
            window.history.replaceState({}, document.title, currentUrl.pathname);
            return;
          }
          setStatus("error");
          setError(sessionError.message);
        } catch (unknownError) {
          console.error("Supabase setSession error", unknownError);
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setStatus("ready");
            window.history.replaceState({}, document.title, currentUrl.pathname);
            return;
          }
          setStatus("error");
          setError("セッションの更新に失敗しました。");
        }
      };

      applyRecoverySession();
      return;
    }

    if (session) {
      setStatus("ready");
      return;
    }

    setStatus("error");
    setError("再設定リンクが無効です。ログイン画面から再度やり直してください。");
  }, [session, supabaseAvailable]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase クライアントの初期化に失敗しました。");
      return;
    }
    if (password !== passwordConfirm) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("パスワードを更新しました。ログイン画面に移動します。");
      setTimeout(() => {
        router.replace("/auth");
      }, 1200);
    } catch (updateError) {
      if (updateError && typeof updateError === "object" && "message" in updateError) {
        setError(String(updateError.message));
      } else {
        setError("パスワードの更新に失敗しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!supabaseAvailable) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>ログイン設定が無効です</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Supabase の公開 URL と anon キーが設定されていないため、ログイン機能を利用できません。</p>
            <p>
              <Link href="/" className="underline">
                トップページに戻る
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>パスワードの再設定</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {status === "loading" ? <p>再設定リンクを確認しています…</p> : null}
            {status === "error" ? <p className="text-destructive">{error}</p> : null}
            {status === "ready" ? (
              <>
                <div className="space-y-1 text-foreground">
                  <Label htmlFor="password">新しいパスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1 text-foreground">
                  <Label htmlFor="passwordConfirm">新しいパスワード（確認用）</Label>
                  <Input
                    id="passwordConfirm"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                    required
                  />
                </div>
                {error ? (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}
                {message ? (
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    {message}
                  </div>
                ) : null}
              </>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" disabled={loading || status !== "ready"} className="w-full">
              パスワードを更新する
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href="/auth">ログイン画面に戻る</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
