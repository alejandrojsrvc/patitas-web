import type { Metadata } from "next";
import { MobileAuthFallback } from "@/components/auth/mobile-auth-fallback";

export const metadata: Metadata = {
  title: "Confirmar cuenta | Patitas Inquietas",
  robots: { index: false, follow: false },
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConfirmAccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string | string[];
    type?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const token = firstValue(query.token);
  const type = firstValue(query.type);
  const supportedType = type === "signup" || type === "magiclink";
  const appHref = token && supportedType
    ? `patitas://auth/confirm?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`
    : null;

  return (
    <MobileAuthFallback
      title="Confirmá tu cuenta en la app"
      description="Abrí Patitas Inquietas para terminar la confirmación y comenzar a usar tu cuenta."
      appHref={appHref}
      invalidMessage="Este enlace de confirmación está incompleto o no es válido. Solicitá un correo nuevo desde la aplicación."
    />
  );
}
