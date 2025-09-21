"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";

export default function AppShell({ children }: { children: ReactNode }) {
  const { session, loading, supabaseAvailable, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {supabaseAvailable ? (
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-sm font-semibold uppercase tracking-wide">
              MMA Roadmap
            </Link>
            <div className="flex items-center gap-3 text-sm">
              {session ? (
                <>
                  {session.user.email ? (
                    <span className="hidden text-muted-foreground sm:inline">
                      {session.user.email}
                    </span>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={signingOut || loading}
                  >
                    ログアウト
                  </Button>
                </>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href="/auth">ログイン</Link>
                </Button>
              )}
            </div>
          </div>
        </header>
      ) : null}
      <main className="pb-12 pt-4 md:pt-6">{children}</main>
    </div>
  );
}
