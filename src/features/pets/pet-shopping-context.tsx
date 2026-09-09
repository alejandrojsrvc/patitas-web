"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { CustomerPet, PetCurrentFoodInput } from "@/domain/customer/types";
import { useSessionShell } from "@/features/session/session-shell-context";

type PetShoppingContextValue = {
  authenticated: boolean;
  pets: CustomerPet[];
  activePet: CustomerPet | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  currentFoodPromptDismissed: boolean;
  selectPet: (petId: string | null) => void;
  dismissCurrentFoodPrompt: () => void;
  saveCurrentFood: (petId: string, input: PetCurrentFoodInput) => Promise<CustomerPet>;
  refresh: () => Promise<void>;
};

const ACTIVE_PET_STORAGE_KEY = "patitas-active-shopping-pet";
const PetShoppingContext = createContext<PetShoppingContextValue | null>(null);

export function PetShoppingProvider({ children }: { children: React.ReactNode }) {
  const session = useSessionShell();
  const authenticated = session?.shell?.viewer.authenticated === true;
  const sessionStatus = session?.status ?? "ready";

  return (
    <PetShoppingState authenticated={authenticated} sessionStatus={sessionStatus}>
      {children}
    </PetShoppingState>
  );
}

function PetShoppingState({
  children,
  authenticated,
  sessionStatus,
}: {
  children: React.ReactNode;
  authenticated: boolean;
  sessionStatus: "loading" | "ready" | "error";
}) {
  const [pets, setPets] = useState<CustomerPet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [dismissedPetIds, setDismissedPetIds] = useState<Set<string>>(() => new Set());
  const [status, setStatus] = useState<PetShoppingContextValue["status"]>(authenticated || sessionStatus === "loading" ? "idle" : "ready");
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);

  const refresh = useCallback(async () => {
    if (!authenticated) return;
    const version = ++requestVersion.current;
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/commerce/me/pets", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as CustomerPet[] | { message?: string } | null;
      if (!response.ok || !Array.isArray(payload)) {
        throw new Error(payload && !Array.isArray(payload) && payload.message ? payload.message : "No pudimos cargar tus mascotas.");
      }
      if (version !== requestVersion.current) return;
      setPets(payload);
      const storedId = readStoredPetId();
      setActivePetId((current) => {
        const candidate = current ?? storedId;
        return candidate && payload.some((pet) => pet.id === candidate) ? candidate : null;
      });
      setStatus("ready");
    } catch (cause) {
      if (version !== requestVersion.current) return;
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "No pudimos cargar tus mascotas.");
    }
  }, [authenticated]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!authenticated) {
      requestVersion.current += 1;
      removeStoredPetId();
      const timer = window.setTimeout(() => {
        setPets([]);
        setActivePetId(null);
        setDismissedPetIds(new Set<string>());
        setStatus("ready");
        setError(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [authenticated, refresh, sessionStatus]);

  useEffect(() => {
    const handlePetsChanged = () => void refresh();
    window.addEventListener("patitas-pets-changed", handlePetsChanged);
    return () => window.removeEventListener("patitas-pets-changed", handlePetsChanged);
  }, [refresh]);

  const activePet = pets.find((pet) => pet.id === activePetId) ?? null;

  const selectPet = useCallback((petId: string | null) => {
    setActivePetId(petId);
    if (petId) writeStoredPetId(petId);
    else removeStoredPetId();
  }, []);

  const dismissCurrentFoodPrompt = useCallback(() => {
    if (!activePetId) return;
    setDismissedPetIds((current) => new Set(current).add(activePetId));
  }, [activePetId]);

  const saveCurrentFood = useCallback(async (petId: string, input: PetCurrentFoodInput) => {
    const response = await fetch(`/api/commerce/me/pets/${encodeURIComponent(petId)}/current-food`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const payload = (await response.json().catch(() => null)) as CustomerPet | { message?: string } | null;
    if (!response.ok || !payload || !("id" in payload)) {
      throw new Error(payload && "message" in payload && payload.message ? payload.message : "No pudimos guardar su alimento actual.");
    }
    const saved = payload as CustomerPet;
    setPets((current) => current.map((pet) => (pet.id === saved.id ? saved : pet)));
    setDismissedPetIds((current) => {
      const next = new Set(current);
      next.delete(saved.id);
      return next;
    });
    return saved;
  }, []);

  const value = useMemo<PetShoppingContextValue>(
    () => ({
      pets,
      authenticated,
      activePet,
      status,
      error,
      currentFoodPromptDismissed: Boolean(activePet && dismissedPetIds.has(activePet.id)),
      selectPet,
      dismissCurrentFoodPrompt,
      saveCurrentFood,
      refresh,
    }),
    [activePet, authenticated, dismissCurrentFoodPrompt, dismissedPetIds, error, pets, refresh, saveCurrentFood, selectPet, status],
  );

  return <PetShoppingContext.Provider value={value}>{children}</PetShoppingContext.Provider>;
}

export function usePetShopping() {
  const context = useContext(PetShoppingContext);
  if (!context) throw new Error("usePetShopping debe usarse dentro de PetShoppingProvider.");
  return context;
}

export function notifyPetsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("patitas-pets-changed"));
}

function readStoredPetId() {
  try {
    return window.localStorage.getItem(ACTIVE_PET_STORAGE_KEY);
  } catch {
    return null;
  }
}

function removeStoredPetId() {
  try {
    window.localStorage.removeItem(ACTIVE_PET_STORAGE_KEY);
  } catch {
    /* Browsing without persistence is still supported. */
  }
}

function writeStoredPetId(petId: string) {
  try {
    window.localStorage.setItem(ACTIVE_PET_STORAGE_KEY, petId);
  } catch {
    /* Browsing without persistence is still supported. */
  }
}
