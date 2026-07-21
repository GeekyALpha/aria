"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Keeps the dashboard fresh as webhooks / payments land. */
export function AutoRefresh({ intervalMs = 12_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const onFocus = () => router.refresh();
    const id = setInterval(() => router.refresh(), intervalMs);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [router, intervalMs]);
  return null;
}
