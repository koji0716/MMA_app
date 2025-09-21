import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import ClientPWA from "@/components/providers/client-pwa";
import { AuthProvider } from "@/components/providers/auth-provider";
import AppShell from "@/components/layout/app-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MMA Roadmap",
  description: "MMAトレーニングの記録とロードマップを管理するPWA",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen bg-background text-foreground`}>
        <ClientPWA>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ClientPWA>
      </body>
    </html>
  );
}
