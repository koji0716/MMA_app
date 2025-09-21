"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signIn" | "signUp";

export default function AuthPage() {
  const router = useRouter();
  const { session, supabaseAvailable } = useAuth();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.replace("/log");
    }
  }, [router, session]);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase クライアントの初期化に失敗しました。");
      return;
    }
    if (mode === "signUp" && password !== passwordConfirm) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signUp") {
        const redirectUrl = `${window.location.origin}/auth/callback`;
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (signUpError) throw signUpError;
        setMessage("確認メールを送信しました。メール内のリンクからサインインを完了してください。");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        setMessage("ログインに成功しました。練習ログに移動します。");
        router.push("/log");
      }
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        setError(String(error.message));
      } else {
        setError("予期しないエラーが発生しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>メールアドレスで{mode === "signIn" ? "ログイン" : "新規登録"}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                value={password}
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {mode === "signUp" ? (
              <div className="space-y-1">
                <Label htmlFor="passwordConfirm">パスワード（確認用）</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  minLength={6}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  required
                />
              </div>
            ) : null}
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
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" disabled={loading} className="w-full">
              {mode === "signIn" ? "ログイン" : "登録メールを送信"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() => {
                setMode(mode === "signIn" ? "signUp" : "signIn");
                setError(null);
                setMessage(null);
              }}
            >
              {mode === "signIn" ? "新規登録はこちら" : "既にアカウントをお持ちの方はこちら"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/">トップに戻る</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
