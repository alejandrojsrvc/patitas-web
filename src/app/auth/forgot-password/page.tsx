import type { Metadata } from "next";

import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Patitas Inquietas",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <PasswordRecoveryForm />;
}
