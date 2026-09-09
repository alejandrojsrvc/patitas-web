"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { CustomerProfile } from "@/domain/customer/types";
import type { AccountScreen, StorefrontShell } from "@/domain/storefront/types";
import { requestAccountScreen, type AccountApiError } from "./account-api";
import { accountRequestKey, type AccountRequest } from "./account-routing";

type AccountAuthState = "authenticated" | "loading" | "guest" | "error";

type AccountResource = {
  data: AccountScreen | null;
  loading: boolean;
  error: string | null;
};

type AccountContextValue = {
  shell: StorefrontShell | null;
  profile: CustomerProfile | null;
  status: AccountAuthState;
  bootstrapError: string | null;
  resources: Record<string, AccountResource>;
  load: (request: AccountRequest, force?: boolean) => Promise<AccountScreen>;
  refreshCurrent: () => Promise<AccountScreen>;
  updateProfile: (profile: CustomerProfile) => void;
  updateScreen: (request: AccountRequest, updater: (screen: AccountScreen) => AccountScreen) => void;
  clearSession: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({
  children,
  initialData,
  initialError,
  initialRequest,
  initialGuest = false,
}: {
  children: React.ReactNode;
  initialData: AccountScreen | null;
  initialError?: string | null;
  initialRequest: AccountRequest;
  initialGuest?: boolean;
}) {
  const initialKey = accountRequestKey(initialRequest);
  const [shell, setShell] = useState<StorefrontShell | null>(initialData?.shell ?? null);
  const [profile, setProfile] = useState<CustomerProfile | null>(initialData?.profile ?? null);
  const [status, setStatus] = useState<AccountAuthState>(
    initialData ? "authenticated" : initialError ? "error" : initialGuest ? "guest" : "loading",
  );
  const [bootstrapError, setBootstrapError] = useState<string | null>(initialError ?? null);
  const [resources, setResources] = useState<Record<string, AccountResource>>(() => ({
    ...(initialData ? { [initialKey]: { data: initialData, loading: false, error: null } } : {}),
    ...(initialError ? { [initialKey]: { data: null, loading: false, error: initialError } } : {}),
  }));
  const resourcesRef = useRef(resources);
  const shellRef = useRef(shell);
  const inflight = useRef(new Map<string, Promise<AccountScreen>>());

  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  useEffect(() => {
    shellRef.current = shell;
  }, [shell]);

  const load = useCallback(async (request: AccountRequest, force = false) => {
    const key = accountRequestKey(request);
    const current = resourcesRef.current[key];
    if (!force && current?.data) return current.data;
    const pending = inflight.current.get(key);
    if (!force && pending) return pending;

    setResources((previous) => ({
      ...previous,
      [key]: { data: previous[key]?.data ?? null, loading: true, error: null },
    }));

    const promise = requestAccountScreen(request);
    inflight.current.set(key, promise);

    try {
      const data = await promise;
      setResources((previous) => ({ ...previous, [key]: { data, loading: false, error: null } }));
      setShell(data.shell);
      setProfile(data.profile);
      setStatus("authenticated");
      setBootstrapError(null);
      return data;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No pudimos cargar esta sección. Revisá tu conexión y volvé a intentarlo.";
      const unauthorized = isAccountApiError(cause) && cause.status === 401;
      setResources((previous) => ({
        ...previous,
        [key]: { data: previous[key]?.data ?? null, loading: false, error: message },
      }));
      if (unauthorized) {
        setShell(null);
        setProfile(null);
        setStatus("guest");
      } else if (!shellRef.current) {
        setStatus("error");
        setBootstrapError(message);
      }
      throw cause;
    } finally {
      inflight.current.delete(key);
    }
  }, []);

  useEffect(() => {
    if (initialData || initialError || initialGuest) return;
    const timer = window.setTimeout(() => void load(initialRequest).catch(() => undefined), 0);
    return () => window.clearTimeout(timer);
  }, [initialData, initialError, initialGuest, initialRequest, load]);

  const refreshCurrent = useCallback(() => load(initialRequest, true), [initialRequest, load]);

  const updateProfile = useCallback((nextProfile: CustomerProfile) => {
    setProfile(nextProfile);
    setShell((current) =>
      current && current.viewer.authenticated ? { ...current, viewer: { ...current.viewer, displayName: nextProfile.fullName } } : current,
    );
    setResources((previous) =>
      Object.fromEntries(
        Object.entries(previous).map(([key, resource]) => [
          key,
          resource.data ? { ...resource, data: { ...resource.data, profile: nextProfile } } : resource,
        ]),
      ),
    );
  }, []);

  const updateScreen = useCallback((request: AccountRequest, updater: (screen: AccountScreen) => AccountScreen) => {
    const key = accountRequestKey(request);
    const current = resourcesRef.current[key];
    if (!current?.data) return;
    const data = updater(current.data);
    setResources((previous) => (previous[key]?.data ? { ...previous, [key]: { ...previous[key], data } } : previous));
    setShell(data.shell);
    setProfile(data.profile);
  }, []);

  const clearSession = useCallback(() => {
    setShell(null);
    setProfile(null);
    setStatus("guest");
    setBootstrapError(null);
    setResources({});
    inflight.current.clear();
  }, []);

  const value = useMemo<AccountContextValue>(
    () => ({
      shell,
      profile,
      status,
      bootstrapError,
      resources,
      load,
      refreshCurrent,
      updateProfile,
      updateScreen,
      clearSession,
    }),
    [bootstrapError, clearSession, load, profile, refreshCurrent, resources, shell, status, updateProfile, updateScreen],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount debe usarse dentro de AccountProvider.");
  return value;
}

export function useAccountScreen(request: AccountRequest) {
  const account = useAccount();
  const key = accountRequestKey(request);
  const { load, status } = account;
  const { section, orderId, page, perPage } = request;
  const stableRequest = useMemo(() => ({ section, orderId, page, perPage }), [orderId, page, perPage, section]);
  const resource = account.resources[key] ?? { data: null, loading: status !== "guest", error: null };

  useEffect(() => {
    if (status !== "guest") void load(stableRequest).catch(() => undefined);
  }, [key, load, stableRequest, status]);

  return {
    ...resource,
    retry: () => load(request, true),
  };
}

function isAccountApiError(cause: unknown): cause is AccountApiError {
  return Boolean(cause && typeof cause === "object" && "status" in cause);
}
