import type { Metadata } from "next";
import { MobileAuthFallback } from "@/components/auth/mobile-auth-fallback";

export const metadata: Metadata = {
  title: "Restablecer contraseña | Patitas Inquietas",
  robots: { index: false, follow: false },
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const token = firstValue((await searchParams).token);
  const appHref = token
    ? `patitas://auth/reset-password?token=${encodeURIComponent(token)}`
    : null;

  return (
    <MobileAuthFallback
      title="Creá tu contraseña en la app"
      description="Abrí Patitas Inquietas para elegir una contraseña nueva y recuperar tu cuenta."
      appHref={appHref}
      invalidMessage="Este enlace de recuperación está incompleto. Solicitá uno nuevo desde la aplicación."
    />
  );
}
