"use client";

import { ReactNode, useEffect } from "react";
import { registerSW } from "@/lib/pwa/register-sw";

export default function ClientPWA({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerSW();
  }, []);

  return <>{children}</>;
}
