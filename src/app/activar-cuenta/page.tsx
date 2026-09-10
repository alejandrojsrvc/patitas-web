"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ActivateAccountPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null);
    const response = await fetch("/api/auth/guest-activation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password, fullName }) });
    const payload = (await response.json().catch(() => null)) as { message?: string; orderId?: string } | null;
    if (!response.ok || !payload?.orderId) { setError(payload?.message ?? "No pudimos activar tu cuenta."); setLoading(false); return; }
    router.replace(`/mi-cuenta/pedidos/${encodeURIComponent(payload.orderId)}`);
  }
  return <main className="mx-auto max-w-xl px-5 py-16"><p className="text-sm font-semibold text-brand-blue">Patitas Inquietas</p><h1 className="mt-3 font-display text-4xl font-semibold">Activá tu cuenta</h1><p className="mt-4 text-muted">Creá una contraseña para consultar tu pedido, entrega y soporte.</p>{token ? <form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-semibold">Nombre<input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full rounded-xl border border-catalog-line p-3" /></label><label className="block text-sm font-semibold">Contraseña<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-catalog-line p-3" /></label>{error ? <p role="alert" className="rounded-xl bg-[#fff1f1] p-3 text-sm text-[#8d2020]">{error}</p> : null}<button disabled={loading} className="min-h-12 rounded-xl bg-brand-blue px-5 font-semibold text-white disabled:opacity-60">{loading ? "Activando…" : "Activar cuenta"}</button></form> : <p className="mt-8 rounded-xl bg-[#fff1f1] p-4 text-[#8d2020]">El enlace de activación no está completo o ya no es válido.</p>}<Link href="/" className="mt-8 inline-block text-sm font-semibold text-brand-blue">Volver al inicio</Link></main>;
}
