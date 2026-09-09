"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { notifySessionChanged } from "@/features/session/session-shell-context";

type AccountConfirmationProps = {
  token: string | null;
  type: "signup" | "magiclink" | null;
};

export function AccountConfirmation({ token, type }: AccountConfirmationProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"ready" | "loading" | "error">("ready");
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!token || !type) {
      setError("Este enlace de confirmación está incompleto o no es válido. Solicitá un correo nuevo.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, type }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message ?? "No pudimos confirmar tu cuenta.");
      notifySessionChanged();
      router.replace("/mi-cuenta");
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "No pudimos confirmar tu cuenta.");
    }
  }

  const appHref = token && type ? `patitas://auth/confirm?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}` : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-page-bg px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <section className="w-full max-w-md rounded-3xl border border-border bg-white px-6 py-9 text-center shadow-[0_20px_55px_rgba(23,23,23,0.08)] sm:px-10 sm:py-11">
        <Image
          src="/brand/patitas-logo-horizontal.png"
          alt="Patitas Inquietas"
          width={220}
          height={24}
          priority
          className="mx-auto h-auto w-[180px]"
        />
        <h1 className="mt-9 text-3xl font-semibold tracking-[-0.035em] text-ink">Confirmá tu correo</h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Activá tu cuenta para consultar tus pedidos, guardar tus datos y comprar más rápido.
        </p>

        {status === "error" ? (
          <p role="alert" className="mt-6 rounded-xl bg-error-surface px-4 py-3 text-sm font-medium leading-6 text-error">
            {error}
          </p>
        ) : null}

        {status !== "error" || Boolean(token && type) ? (
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={status === "loading"}
            className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-brand-blue px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[#0048dc] disabled:opacity-60"
          >
            {status === "loading" ? "Confirmando…" : "Confirmar mi cuenta"}
          </button>
        ) : null}

        {appHref ? (
          <a
            href={appHref}
            className="mt-4 inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-brand-blue underline-offset-4 hover:underline"
          >
            Abrir este enlace en la aplicación
          </a>
        ) : null}

        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Ir al inicio
        </Link>
      </section>
    </main>
  );
}
