"use client";

import { ArrowRight, CheckCircle, Eye, EyeSlash } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { isTurnstileConfigured, TurnstileWidget } from "@/components/security/turnstile-widget";

export function PasswordRecoveryForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    if (isTurnstileConfigured && !turnstileToken) {
      setError("Completá la verificación de seguridad para continuar.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/password-recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(turnstileToken ? { "X-Turnstile-Token": turnstileToken } : {}),
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message ?? "No pudimos enviar el correo de recuperación.");
      setMessage(payload?.message ?? "Si la cuenta existe, enviaremos un correo de recuperación.");
      setTurnstileToken(null);
      setTurnstileResetKey((current) => current + 1);
    } catch (cause) {
      setTurnstileToken(null);
      setTurnstileResetKey((current) => current + 1);
      setError(cause instanceof Error ? cause.message : "No pudimos enviar el correo de recuperación. Volvé a intentarlo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">Recuperá tu contraseña</h1>
      <p className="mt-2 text-muted">Ingresá tu correo y te enviaremos un enlace para crear una contraseña nueva.</p>
      <form onSubmit={submit} aria-busy={loading} className="mt-6 grid gap-4">
        <label htmlFor="recovery-email" className="text-sm font-semibold">
          Correo electrónico
          <input
            id="recovery-email"
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 h-12 w-full rounded-xl border border-catalog-line px-3 text-base font-normal focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          />
        </label>
        <TurnstileWidget action="auth-password-recovery" resetKey={turnstileResetKey} onToken={setTurnstileToken} />
        {error ? (
          <p role="alert" className="rounded-xl bg-error-surface p-3 text-sm text-error">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="rounded-xl bg-success-surface p-3 text-sm text-success">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Enviando correo…" : "Enviar enlace de recuperación"}
          <ArrowRight size={18} weight="bold" aria-hidden="true" />
        </button>
      </form>
      <Link href="/mi-cuenta" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-brand-blue hover:underline">
        Volver a iniciar sesión
      </Link>
    </AuthShell>
  );
}

export function PasswordResetForm({ token }: { token: string | null }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "Este enlace de recuperación está incompleto o venció.");
  const [completed, setCompleted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden. Revisá ambos campos.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message ?? "No pudimos actualizar la contraseña.");
      setCompleted(true);
      setPassword("");
      setConfirmation("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos actualizar la contraseña. Volvé a solicitar el enlace.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">Enlace no válido</h1>
        <p className="mt-2 text-muted">Este enlace está incompleto o venció. Solicitá uno nuevo para recuperar tu cuenta.</p>
        <Link
          href="/auth/forgot-password"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-blue px-5 font-semibold text-white"
        >
          Solicitar otro enlace
        </Link>
        <Link
          href="/mi-cuenta"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-brand-blue hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </AuthShell>
    );
  }

  if (completed) {
    return (
      <AuthShell>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">Contraseña actualizada</h1>
        <p className="mt-2 text-muted">Ya podés iniciar sesión con tu nueva contraseña.</p>
        <Link
          href="/mi-cuenta"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-blue px-5 font-semibold text-white"
        >
          Iniciar sesión
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">Creá una contraseña nueva</h1>
      <p className="mt-2 text-muted">Elegí una contraseña de al menos 8 caracteres para volver a entrar a tu cuenta.</p>
      <form onSubmit={submit} aria-busy={loading} className="mt-6 grid gap-4">
        <PasswordInput
          id="new-password"
          name="newPassword"
          label="Nueva contraseña"
          value={password}
          visible={showPassword}
          disabled={loading}
          onChange={setPassword}
          onToggle={() => setShowPassword((current) => !current)}
        />
        <PasswordInput
          id="confirm-password"
          name="confirmPassword"
          label="Repetí la contraseña"
          value={confirmation}
          visible={showConfirmation}
          disabled={loading}
          onChange={setConfirmation}
          onToggle={() => setShowConfirmation((current) => !current)}
        />
        {error ? (
          <p role="alert" className="rounded-xl bg-error-surface p-3 text-sm text-error">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Actualizando contraseña…" : "Actualizar contraseña"}
          <CheckCircle size={18} weight="bold" aria-hidden="true" />
        </button>
      </form>
      <Link
        href="/mi-cuenta"
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-brand-blue hover:underline"
      >
        Volver a iniciar sesión
      </Link>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-catalog-canvas px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <section className="w-full max-w-md rounded-2xl border border-catalog-line bg-white px-5 py-7 sm:px-7 sm:py-8">
        <Image
          src="/brand/patitas-logo-horizontal.png"
          alt="Patitas Inquietas"
          width={220}
          height={24}
          priority
          className="mx-auto h-auto w-[160px]"
        />
        <div className="mt-7">{children}</div>
      </section>
    </main>
  );
}

function PasswordInput({
  id,
  name,
  label,
  value,
  visible,
  disabled,
  onChange,
  onToggle,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  visible: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  const Icon = visible ? EyeSlash : Eye;
  return (
    <label htmlFor={id} className="text-sm font-semibold">
      {label}
      <span className="relative mt-1 block">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-catalog-line px-3 pr-12 text-base font-normal focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:bg-catalog-soft"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted hover:text-ink disabled:opacity-50"
        >
          <Icon size={19} aria-hidden="true" />
        </button>
      </span>
    </label>
  );
}
