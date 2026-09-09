import type { Metadata } from "next";

import { PasswordResetForm } from "@/components/auth/password-recovery-form";

export const metadata: Metadata = {
  title: "Restablecer contraseña | Patitas Inquietas",
  robots: { index: false, follow: false },
};

function firstValue(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const token = firstValue((await searchParams).token);
  return <PasswordResetForm token={token ?? null} />;
}
