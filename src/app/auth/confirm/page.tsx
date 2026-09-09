import type { Metadata } from "next";
import { AccountConfirmation } from "@/components/auth/account-confirmation";

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
  const supportedType = type === "signup" || type === "magiclink" ? type : null;

  return <AccountConfirmation token={token ?? null} type={supportedType} />;
}
