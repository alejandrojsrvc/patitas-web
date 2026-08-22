export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

export type CurrentUser = {
  userId: string;
  email: string;
  role: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
};

export type AuthResponse = {
  status: "authenticated" | "verification_required";
  user: AuthUser | null;
  session: AuthSession | null;
};
