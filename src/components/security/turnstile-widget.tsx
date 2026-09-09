"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileWidgetApi = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    action: string;
    theme: "light";
    size: "flexible";
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileWidgetApi;
  }
}

const scriptId = "cloudflare-turnstile-api";
const scriptSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
export const isTurnstileConfigured = Boolean(process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim());

export function TurnstileWidget({ action, onToken, resetKey = 0 }: { action: string; onToken: (token: string | null) => void; resetKey?: number }) {
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  const [scriptReady, setScriptReady] = useState(() => typeof window !== "undefined" && Boolean(window.turnstile));

  onTokenRef.current = onToken;

  useEffect(() => {
    if (!siteKey) return;
    const handleReady = () => setScriptReady(true);
    window.addEventListener("patitas-turnstile-ready", handleReady);
    if (window.turnstile) setScriptReady(true);
    return () => window.removeEventListener("patitas-turnstile-ready", handleReady);
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey || !scriptReady || !window.turnstile || !containerRef.current) return;
    const widgetId = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme: "light",
      size: "flexible",
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(null),
      "error-callback": () => onTokenRef.current(null),
    });
    return () => {
      window.turnstile?.remove(widgetId);
      onTokenRef.current(null);
    };
  }, [action, resetKey, scriptReady, siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        id={scriptId}
        src={scriptSrc}
        strategy="afterInteractive"
        onLoad={() => {
          setScriptReady(true);
          window.dispatchEvent(new Event("patitas-turnstile-ready"));
        }}
      />
      <div ref={containerRef} className="min-h-[65px]" aria-label="Verificación de seguridad" />
    </>
  );
}
