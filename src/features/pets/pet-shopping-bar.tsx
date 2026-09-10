"use client";

import { Check, CircleNotch, MagnifyingGlass, PawPrint, Plus, X } from "@phosphor-icons/react";
import Link from "next/link";
import { type FormEvent, useEffect, useId, useState } from "react";

import { ProductImage } from "@/components/catalog/product-image";
import type { Product, ProductAutocompleteItem } from "@/domain/catalog/types";
import type { CustomerPet } from "@/domain/customer/types";
import { getPublicProductAutocomplete } from "@/infrastructure/api/public-catalog-browser";
import { formatMoney } from "@/lib/catalog-formatters";
import { usePetShopping } from "./pet-shopping-context";

export function PetShoppingBar({ product }: { product?: Product }) {
  const shopping = usePetShopping();
  const [editorOpen, setEditorOpen] = useState(false);
  const activePet = shopping.activePet;

  if (!shopping.authenticated || shopping.status === "idle") return null;

  return (
    <section aria-label="Compra personalizada" className="rounded-xl bg-soft-blue px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-yellow text-ink">
            <PawPrint size={22} weight="bold" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-ink">¿Para quién comprás?</h2>
            <p className="mt-0.5 text-sm text-muted">Elegir una mascota es opcional; podés seguir con una compra general.</p>
          </div>
        </div>
        {shopping.status === "loading" && !shopping.pets.length ? (
          <p role="status" className="flex min-h-10 items-center gap-2 text-sm text-muted">
            <CircleNotch size={17} className="animate-spin" aria-hidden="true" /> Cargando mascotas…
          </p>
        ) : shopping.status === "error" ? (
          <button type="button" onClick={() => void shopping.refresh()} className="min-h-10 text-sm font-semibold text-brand-blue">
            Reintentar
          </button>
        ) : shopping.pets.length ? (
          <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto pb-0.5" role="group" aria-label="Elegir para quién comprar">
            <PetChoice
              selected={!activePet}
              onClick={() => {
                setEditorOpen(false);
                shopping.selectPet(null);
              }}
            >
              Compra general
            </PetChoice>
            {shopping.pets.map((pet) => (
              <PetChoice
                key={pet.id}
                selected={activePet?.id === pet.id}
                onClick={() => {
                  setEditorOpen(false);
                  shopping.selectPet(pet.id);
                }}
              >
                {pet.name}
              </PetChoice>
            ))}
            <Link
              href="/mi-cuenta/mascotas"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-brand-blue hover:bg-white"
            >
              <Plus size={15} weight="bold" aria-hidden="true" /> Agregar
            </Link>
          </div>
        ) : (
          <Link href="/mi-cuenta/mascotas" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand-blue">
            <Plus size={16} weight="bold" aria-hidden="true" /> Agregar mascota
          </Link>
        )}
      </div>

      {activePet ? (
        <div className="mt-4 border-t border-catalog-line pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                Comprando para {activePet.name} · {petSummary(activePet)}
              </p>
              {activePet.currentFood ? (
                <p className="mt-1 truncate text-sm text-muted">
                  Come {activePet.currentFood.brand} {activePet.currentFood.name}
                  {activePet.currentFood.weightGrams ? ` · ${formatWeight(activePet.currentFood.weightGrams)}` : ""}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">Todavía no sabemos qué alimento consume.</p>
              )}
              {product && activePet.currentFood?.productId === product.id ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-brand-blue">
                  <Check size={15} weight="bold" aria-hidden="true" /> Es su alimento habitual
                </p>
              ) : product?.species && product.species.toLowerCase() !== activePet.species ? (
                <p className="mt-1 text-sm text-[#8d2020]">Este producto no coincide con la especie registrada de {activePet.name}.</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href={`/${activePet.species === "dog" ? "perros" : "gatos"}?lifeStage=${encodeURIComponent(catalogLifeStage(activePet))}`}
                scroll={false}
                className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-blue hover:underline"
              >
                Ver alimentos para {activePet.name}
              </Link>
              <button
                type="button"
                onClick={() => setEditorOpen((current) => !current)}
                className="inline-flex min-h-10 items-center text-sm font-semibold text-ink hover:text-brand-blue"
              >
                {activePet.currentFood ? "Cambiar su alimento" : "Indicar qué come"}
              </button>
            </div>
          </div>

          {!activePet.currentFood && !shopping.currentFoodPromptDismissed && !editorOpen ? (
            <div className="mt-4 flex flex-col gap-3 border-t border-catalog-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">¿Qué alimento consume actualmente {activePet.name}?</p>
                <p className="mt-1 text-sm text-muted">Así podemos calcular duración y facilitar su próxima compra.</p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button type="button" onClick={shopping.dismissCurrentFoodPrompt} className="min-h-10 text-sm font-semibold text-muted">
                  Ahora no
                </button>
                <button type="button" onClick={() => setEditorOpen(true)} className="min-h-10 text-sm font-semibold text-brand-blue">
                  Indicar alimento
                </button>
              </div>
            </div>
          ) : null}

          {editorOpen ? <CurrentFoodEditor pet={activePet} onClose={() => setEditorOpen(false)} /> : null}
        </div>
      ) : null}
    </section>
  );
}

function PetChoice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={
        "min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold transition-colors " +
        (selected ? "bg-brand-blue text-white" : "bg-white text-ink hover:text-brand-blue")
      }
    >
      {children}
    </button>
  );
}

function CurrentFoodEditor({ pet, onClose }: { pet: CustomerPet; onClose: () => void }) {
  const shopping = usePetShopping();
  const [mode, setMode] = useState<"search" | "custom">("search");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ProductAutocompleteItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (mode !== "search" || trimmedQuery.length < 2) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void getPublicProductAutocomplete(trimmedQuery)
        .then((result) => {
          if (!active) return;
          setItems(result.items.filter((item) => isFoodForPet(item, pet)));
          setStatus("success");
        })
        .catch(() => {
          if (!active) return;
          setItems([]);
          setStatus("error");
        });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mode, pet, trimmedQuery]);

  function changeMode(nextMode: "search" | "custom") {
    setMode(nextMode);
    setItems([]);
    setStatus("idle");
    setError(null);
  }

  function changeQuery(value: string) {
    setQuery(value);
    setItems([]);
    setStatus(value.trim().length >= 2 ? "loading" : "idle");
  }

  async function chooseCatalogFood(item: ProductAutocompleteItem) {
    setSaving(true);
    setError(null);
    try {
      await shopping.saveCurrentFood(pet.id, { source: "catalog", productId: item.productId, variantId: item.id });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar este alimento.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCustomFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const weightKg = Number(String(data.get("weightKg") ?? "").replace(",", "."));
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setError("Ingresá una presentación válida en kilos.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await shopping.saveCurrentFood(pet.id, {
        source: "custom",
        brand: String(data.get("brand") ?? "").trim(),
        name: String(data.get("name") ?? "").trim(),
        weightGrams: Math.round(weightKg * 1000),
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar este alimento.");
    } finally {
      setSaving(false);
    }
  }

  async function clearCurrentFood() {
    setSaving(true);
    setError(null);
    try {
      await shopping.saveCurrentFood(pet.id, { source: "none" });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos quitar este alimento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border-t border-catalog-line pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Alimento actual de {pet.name}</p>
          <p className="mt-1 text-sm text-muted">Elegí una presentación exacta o ingresala manualmente.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex size-10 items-center justify-center rounded-lg hover:bg-catalog-canvas"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4 flex gap-2" role="group" aria-label="Cómo indicar el alimento">
        <PetChoice selected={mode === "search"} onClick={() => changeMode("search")}>
          Buscar en Patitas
        </PetChoice>
        <PetChoice selected={mode === "custom"} onClick={() => changeMode("custom")}>
          No está en Patitas
        </PetChoice>
      </div>
      {mode === "search" ? (
        <div className="relative mt-4 max-w-2xl">
          <label htmlFor={inputId} className="text-sm font-semibold">
            Buscar alimento o marca
          </label>
          <div className="relative mt-2">
            <MagnifyingGlass
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-blue"
              aria-hidden="true"
            />
            <input
              id={inputId}
              type="search"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              autoComplete="off"
              placeholder="Ej. Excellent adulto 15 kg"
              className="h-12 w-full rounded-xl border border-catalog-line bg-white pl-10 pr-10 outline-none focus:border-brand-blue"
            />
            {status === "loading" ? (
              <CircleNotch
                size={18}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-brand-blue"
                aria-hidden="true"
              />
            ) : null}
          </div>
          {trimmedQuery.length > 0 && trimmedQuery.length < 2 ? (
            <p className="mt-2 text-xs text-muted">Escribí al menos dos caracteres.</p>
          ) : null}
          {status === "error" ? <p className="mt-2 text-sm text-[#8d2020]">No pudimos buscar ahora. Volvé a intentar.</p> : null}
          {status === "success" && !items.length ? (
            <p className="mt-2 text-sm text-muted">No encontramos coincidencias. Podés ingresarlo manualmente.</p>
          ) : null}
          {items.length ? (
            <ul className="mt-2 max-h-72 overflow-y-auto rounded-xl bg-white py-1 shadow-[0_14px_36px_rgba(23,23,23,0.14)]">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void chooseCatalogFood(item)}
                    className="flex min-h-[4.5rem] w-full items-center gap-3 px-3 py-2 text-left hover:bg-soft-blue disabled:cursor-wait disabled:opacity-60"
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-catalog-soft">
                      <ProductImage src={item.image?.url} alt="" preset="thumbnail" sizes="48px" className="p-1" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-muted">{item.brand.name}</span>
                      <span className="mt-0.5 block truncate text-sm font-semibold">{item.displayName}</span>
                    </span>
                    <strong className="shrink-0 text-sm tabular-nums text-brand-blue">{formatMoney(item.salePrice)}</strong>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <form onSubmit={saveCustomFood} className="mt-4 grid gap-3 sm:grid-cols-3">
          <FoodField name="brand" label="Marca" placeholder="Ej. Excellent" />
          <FoodField name="name" label="Alimento" placeholder="Ej. Adulto mediano" />
          <FoodField name="weightKg" label="Presentación (kg)" placeholder="Ej. 15" inputMode="decimal" />
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-xl bg-brand-blue px-4 font-semibold text-white disabled:cursor-wait disabled:opacity-60 sm:col-span-3 sm:justify-self-end"
          >
            {saving ? "Guardando…" : "Guardar alimento"}
          </button>
        </form>
      )}
      {pet.currentFood ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => void clearCurrentFood()}
          className="mt-4 min-h-10 text-sm font-semibold text-muted underline-offset-4 hover:text-[#8d2020] hover:underline disabled:cursor-wait disabled:opacity-60"
        >
          Quitar alimento actual
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-[#8d2020]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FoodField({ name, label, ...props }: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        {...props}
        name={name}
        required
        className="mt-2 h-11 w-full rounded-xl border border-catalog-line px-3 font-normal outline-none focus:border-brand-blue"
      />
    </label>
  );
}

function petSummary(pet: CustomerPet) {
  return `${pet.species === "dog" ? "Perro" : "Gato"}, ${pet.weightKg.replace(".", ",")} kg`;
}

function catalogLifeStage(pet: CustomerPet) {
  return pet.lifeStage === "puppy" ? "PUPPY" : pet.lifeStage.toUpperCase();
}

function formatWeight(weightGrams: number) {
  return weightGrams >= 1000 ? `${(weightGrams / 1000).toLocaleString("es-AR", { maximumFractionDigits: 2 })} kg` : `${weightGrams} g`;
}

function isFoodForPet(item: ProductAutocompleteItem, pet: CustomerPet) {
  const species = item.species?.trim().toLowerCase();
  const matchesSpecies =
    pet.species === "dog"
      ? species === "dog" || species === "perro"
      : species === "cat" || species === "gato";
  return matchesSpecies && ["alimento-seco", "alimento-humedo"].includes(item.categorySlug);
}
