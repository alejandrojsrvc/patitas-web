"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

let refreshInFlight: Promise<boolean> | null = null;
let navigationClaimed = false;

export function SessionRefreshBoundary({
  required,
  children = null,
  failure = null,
}: {
  required: boolean;
  children?: React.ReactNode;
  failure?: React.ReactNode;
}) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!required) return;
    let active = true;

    void refreshSession().then((shouldReload) => {
      if (!active) return;
      if (!shouldReload) {
        setFailed(true);
        return;
      }
      if (!navigationClaimed) {
        navigationClaimed = true;
        router.refresh();
        window.setTimeout(() => {
          navigationClaimed = false;
        }, 1_000);
      }
    });

    return () => {
      active = false;
    };
  }, [required, router]);

  if (failed) return failure;
  return children;
}

function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", { method: "POST" })
      .then((response) => response.ok || response.status === 401)
      .catch(() => false)
      .finally(() => {
        window.setTimeout(() => {
          refreshInFlight = null;
        }, 1_000);
      });
  }
  return refreshInFlight;
}
