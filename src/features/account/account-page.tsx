"use client";

import {
  ArrowClockwise,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeSlash,
  House,
  MapPin,
  Package,
  PawPrint,
  PencilSimple,
  SignOut,
  Trash,
  UserCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, type InputHTMLAttributes, useEffect, useRef, useState } from "react";
import { GoogleAddressAutocomplete, type GoogleAddressSelection } from "@/features/checkout/google-address-autocomplete";
import { splitApartment, joinApartment } from "@/features/checkout/address-fields";
import { isTurnstileConfigured, TurnstileWidget } from "@/components/security/turnstile-widget";

import type {
  CustomerAddress,
  CustomerAddressInput,
  CustomerPet,
  CustomerPetInput,
  CustomerProfile,
  CustomerProfileInput,
  OrderListItem,
  OrderSummary,
  ReplenishmentPlanSummary,
} from "@/domain/customer/types";
import type { AccountOrdersSection, AccountScreen, StorefrontLocation } from "@/domain/storefront/types";
import { paymentRedirectUrl, paymentStatusLabel } from "@/features/checkout/payment-flow";
import { useCart } from "@/features/cart/cart-context";
import { notifySessionChanged } from "@/features/session/session-shell-context";
import { notifyPetsChanged } from "@/features/pets/pet-shopping-context";
import { formatMoney } from "@/lib/catalog-formatters";
import { errorMessage, requestAccountJson } from "./account-api";
import { useAccount, useAccountScreen } from "./account-context";
import { accountSectionFromPathname, type AccountRequest, type AccountSection } from "./account-routing";

const navigation: Array<{ label: string; href: string; section: AccountSection; Icon: typeof House }> = [
  { label: "Resumen", href: "/mi-cuenta", section: "resumen", Icon: House },
  { label: "Pedidos", href: "/mi-cuenta/pedidos", section: "pedidos", Icon: Package },
  { label: "Direcciones", href: "/mi-cuenta/direcciones", section: "direcciones", Icon: MapPin },
  { label: "Mascotas", href: "/mi-cuenta/mascotas", section: "mascotas", Icon: PawPrint },
  { label: "Reposiciones", href: "/mi-cuenta/reposiciones", section: "reposiciones", Icon: ArrowClockwise },
];

const sectionCopy: Record<AccountSection, { title: string; description: string }> = {
  resumen: { title: "Tu cuenta, en orden", description: "Consultá tus datos, pedidos y próximas reposiciones desde un solo lugar." },
  pedidos: { title: "Tus pedidos", description: "Consultá el estado, el pago y el detalle de cada compra." },
  direcciones: { title: "Dónde recibir tus pedidos", description: "Guardá tus direcciones habituales para elegirlas al comprar." },
  mascotas: { title: "Tus mascotas", description: "Guardá sus datos para obtener cálculos y recomendaciones más precisos." },
  reposiciones: {
    title: "Próximas reposiciones",
    description: "Consultá cuándo se terminaría cada producto y volvé a pedirlo cuando quieras.",
  },
};

export function AccountFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeSection = accountSectionFromPathname(pathname);
  const account = useAccount();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("No pudimos cerrar tu sesión. Volvé a intentarlo.");
      account.clearSession();
      notifySessionChanged();
    } catch (cause) {
      setLogoutError(errorMessage(cause, "No pudimos cerrar tu sesión. Volvé a intentarlo."));
    } finally {
      setLoggingOut(false);
    }
  }

  if (account.status === "loading" && !account.shell) return <AccountSectionSkeleton />;

  if (account.status === "error" && !account.shell) {
    return (
      <AccountLoadError
        message={account.bootstrapError ?? "Revisá tu conexión y volvé a intentarlo."}
        onRetry={() => void account.refreshCurrent().catch(() => undefined)}
      />
    );
  }

  if (!account.shell?.viewer.authenticated) return <AuthPanel />;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <AccountSidebar
        activeSection={activeSection}
        loggingOut={loggingOut}
        logoutError={logoutError}
        onLogout={() => void handleLogout()}
      />
      <section className="min-w-0">
        <AccountHeader section={activeSection} />
        {children}
      </section>
    </div>
  );
}

function AccountSidebar({
  activeSection,
  loggingOut,
  logoutError,
  onLogout,
}: {
  activeSection: AccountSection;
  loggingOut: boolean;
  logoutError: string | null;
  onLogout: () => void;
}) {
  const account = useAccount();
  const viewer = account.shell?.viewer;
  if (!viewer?.authenticated) return null;

  return (
    <aside className="lg:sticky lg:top-6" aria-label="Navegación de tu cuenta">
      <details className="group rounded-2xl border border-catalog-line bg-white lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold [&::-webkit-details-marker]:hidden">
          <span>Sección: {sectionCopy[activeSection].title}</span>
          <ArrowRight size={18} className="rotate-90 transition-transform group-open:-rotate-90" aria-hidden="true" />
        </summary>
        <AccountNavItems activeSection={activeSection} />
        <div className="border-t border-catalog-line px-4 pb-3 pt-3">
          <p className="truncate text-xs text-muted">{account.profile?.fullName || viewer.email}</p>
          {logoutError ? (
            <p role="alert" className="mt-2 rounded-lg bg-error-surface p-2 text-xs text-error">
              {logoutError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="mt-2 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-ink disabled:opacity-60"
          >
            <SignOut size={17} aria-hidden="true" />
            {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      </details>
      <div className="hidden rounded-2xl border border-catalog-line bg-white p-3 lg:block">
        <div className="flex items-center gap-3 border-b border-catalog-line px-2 pb-4 pt-1">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-yellow text-ink">
            <UserCircle size={23} weight="bold" />
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm">{account.profile?.fullName || viewer.email}</strong>
          </span>
        </div>
        <AccountNavItems activeSection={activeSection} />
        {logoutError ? (
          <p role="alert" className="mt-3 rounded-lg bg-error-surface p-2 text-xs text-error">
            {logoutError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="mt-2 flex min-h-11 w-full items-center gap-2 border-t border-catalog-line px-2 pt-3 text-left text-sm font-semibold text-muted hover:text-ink disabled:opacity-60"
        >
          <SignOut size={18} aria-hidden="true" />
          {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}

function AccountNavItems({ activeSection }: { activeSection: AccountSection }) {
  return (
    <nav className="grid gap-1 p-2" aria-label="Secciones de cuenta">
      {navigation.map(({ Icon, ...item }) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={activeSection === item.section ? "page" : undefined}
          className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${activeSection === item.section ? "bg-soft-blue text-brand-blue" : "text-muted hover:bg-catalog-canvas hover:text-ink"}`}
        >
          <Icon size={18} weight={activeSection === item.section ? "bold" : "regular"} aria-hidden="true" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function AccountHeader({ section }: { section: AccountSection }) {
  const copy = sectionCopy[section];
  return (
    <header>
      <h1 className="display-heading text-3xl sm:text-4xl">{copy.title}</h1>
      <p className="mt-2 max-w-2xl text-base leading-7 text-muted">{copy.description}</p>
    </header>
  );
}

export function AccountPage({ section, request }: { section: AccountSection; request: AccountRequest }) {
  const screen = useAccountScreen(request);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!message && !error) return;
    const frame = window.requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
      feedbackRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [error, message]);

  if (screen.error && !screen.data)
    return <SectionLoadError message={screen.error} onRetry={() => void screen.retry().catch(() => undefined)} />;
  if (screen.loading && !screen.data)
    return (
      <div className="mt-7">
        <AccountSectionSkeleton />
      </div>
    );
  if (!screen.data)
    return (
      <SectionLoadError
        message="No encontramos los datos de esta sección. Volvé a intentar para cargarlos."
        onRetry={() => void screen.retry().catch(() => undefined)}
      />
    );

  const sectionData = screen.data.section;
  return (
    <div className="mt-7">
      {error ? (
        <p
          ref={feedbackRef}
          role="alert"
          tabIndex={-1}
          className="mb-5 rounded-xl border border-error/30 bg-error-surface p-4 text-sm text-error outline-none"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          ref={feedbackRef}
          role="status"
          tabIndex={-1}
          className="mb-5 rounded-xl border border-[#cfe0ff] bg-soft-blue p-4 text-sm text-ink outline-none"
        >
          {message}
        </p>
      ) : null}
      {section === "resumen" && sectionData.type === "overview" ? (
        <Summary profile={screen.data.profile} overview={sectionData} setMessage={setMessage} setError={setError} />
      ) : null}
      {section === "pedidos" && (sectionData.type === "orders" || sectionData.type === "order-detail") ? (
        <Orders
          orders={sectionData.type === "orders" ? sectionData.orders : []}
          detail={sectionData.type === "order-detail" ? sectionData.order : null}
          meta={sectionData.type === "orders" ? sectionData.meta : undefined}
        />
      ) : null}
      {section === "direcciones" && sectionData.type === "addresses" ? (
        <Addresses request={request} addresses={sectionData.addresses} setMessage={setMessage} setError={setError} />
      ) : null}
      {section === "mascotas" && sectionData.type === "pets" ? (
        <Pets request={request} pets={sectionData.pets} setMessage={setMessage} setError={setError} />
      ) : null}
      {section === "reposiciones" && sectionData.type === "replenishments" ? (
        <Replenishments request={request} plans={sectionData.replenishments} setMessage={setMessage} setError={setError} />
      ) : null}
      {!sectionMatchesData(section, sectionData.type) ? (
        <SectionLoadError
          message="Algo salió mal al cargar estos datos. Volvé a intentarlo."
          onRetry={() => void screen.retry().catch(() => undefined)}
        />
      ) : null}
    </div>
  );
}

function Summary({
  profile,
  overview,
  setMessage,
  setError,
}: {
  profile: CustomerProfile;
  overview: { orderCount: number; recentOrders: OrderListItem[] };
  setMessage: (value: string | null) => void;
  setError: (value: string | null) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <ProfileEditor profile={profile} setMessage={setMessage} setError={setError} />
        <div className="rounded-2xl border border-catalog-line bg-soft-blue p-5">
          <p className="text-sm text-muted">Pedidos realizados</p>
          <p className="mt-2 font-display text-4xl font-semibold">{overview.orderCount}</p>
          <div className="mt-5 grid gap-3">
            <Link
              href="/mi-cuenta/reposiciones"
              className="inline-flex min-h-11 items-center justify-between gap-2 rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white"
            >
              Ver tus próximas reposiciones <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/reponer" className="inline-flex min-h-11 items-center justify-between gap-2 text-sm font-semibold text-brand-blue">
              Organizar una reposición <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
      <section className="rounded-2xl border border-catalog-line bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Últimos pedidos</h2>
            <p className="mt-1 text-sm text-muted">Consultá el estado y el detalle de tus compras recientes.</p>
          </div>
          <Link href="/mi-cuenta/pedidos" className="text-sm font-semibold text-brand-blue">
            Ver todos los pedidos
          </Link>
        </div>
        {overview.recentOrders.length ? (
          <div className="mt-4 divide-y divide-catalog-line">
            {overview.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/mi-cuenta/pedidos/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-2 hover:text-brand-blue"
              >
                <span>
                  <strong className="block text-sm text-ink">Pedido {order.number ?? order.id}</strong>
                  <span className="text-sm text-muted">{formatAccountDate(order.createdAt)}</span>
                </span>
                <span className="font-semibold tabular-nums text-ink">{formatMoney(Number(order.total))}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-catalog-canvas p-4 text-sm text-muted">
            Todavía no tenés pedidos. Cuando hagas tu primera compra, va a aparecer acá.
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-catalog-line pt-4 text-sm font-semibold">
          <Link href="/mi-cuenta/mascotas" className="text-brand-blue">
            Ver tus mascotas
          </Link>
          <Link href="/mi-cuenta/direcciones" className="text-brand-blue">
            Ver tus direcciones
          </Link>
        </div>
      </section>
    </div>
  );
}

function ProfileEditor({
  profile,
  setMessage,
  setError,
}: {
  profile: CustomerProfile;
  setMessage: (value: string | null) => void;
  setError: (value: string | null) => void;
}) {
  const account = useAccount();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const data = new FormData(event.currentTarget);
    const input: CustomerProfileInput = {
      fullName: String(data.get("fullName") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim() || null,
    };
    try {
      account.updateProfile(await requestAccountJson<CustomerProfile>("/me/customer", { method: "PATCH", body: JSON.stringify(input) }));
      notifySessionChanged();
      setEditing(false);
      setMessage("Tus datos personales se actualizaron.");
    } catch (cause) {
      setError(errorMessage(cause, "No pudimos actualizar tus datos. Volvé a intentarlo."));
    } finally {
      setSaving(false);
    }
  }
  if (editing)
    return (
      <form onSubmit={save} className="rounded-2xl border border-catalog-line bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Editar mis datos</h2>
          </div>
          <button type="button" onClick={() => setEditing(false)} className="text-sm font-semibold text-muted hover:text-ink">
            Cancelar edición
          </button>
        </div>
        <div className="mt-5 grid gap-3">
          <AddressField name="fullName" label="Nombre y apellido" defaultValue={profile.fullName} maxLength={160} />
          <AddressField
            name="phone"
            label="Teléfono (opcional)"
            type="tel"
            defaultValue={profile.phone ?? ""}
            required={false}
            maxLength={40}
          />
          <p className="text-sm text-muted">Correo: {profile.email}</p>
        </div>
        <FormActions saving={saving} label="Guardar cambios" onCancel={() => setEditing(false)} />
      </form>
    );
  return (
    <section className="rounded-2xl border border-catalog-line bg-white p-5 sm:p-6">
      <h2 className="font-display text-2xl font-semibold">{profile.fullName || "Completá tu nombre"}</h2>
      <p className="mt-1 text-muted">{profile.email}</p>
      <p className="mt-1 text-muted">{profile.phone || "No agregaste un teléfono"}</p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        <PencilSimple size={16} aria-hidden="true" />
        Editar mis datos
      </button>
    </section>
  );
}

function Addresses({
  request,
  addresses,
  setMessage,
  setError,
}: {
  request: AccountRequest;
  addresses: CustomerAddress[];
  setMessage: (value: string | null) => void;
  setError: (value: string | null) => void;
}) {
  const account = useAccount();
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  function update(nextAddresses: CustomerAddress[]) {
    account.updateScreen(request, (current) => ({
      ...current,
      shell: { ...current.shell, location: locationFromAddresses(nextAddresses) },
      section: { type: "addresses", addresses: nextAddresses },
    }));
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const data = new FormData(event.currentTarget);
    const input: CustomerAddressInput = {
      label: String(data.get("label") ?? "").trim(),
      recipientName: String(data.get("recipientName") ?? "").trim(),
      street: String(data.get("street") ?? "").trim(),
      number: String(data.get("number") ?? "").trim(),
      city: String(data.get("city") ?? "").trim(),
      province: String(data.get("province") ?? "").trim(),
      postalCode: String(data.get("postalCode") ?? "").trim(),
      isDefault: data.get("isDefault") === "on",
      phone: optionalValue(data.get("phone")),
      apartment: joinApartment({ floor: String(data.get("floor") ?? ""), department: String(data.get("department") ?? "") }) || null,
      neighborhood: optionalValue(data.get("neighborhood")),
      reference: optionalValue(data.get("reference")),
    };
    try {
      const saved = await requestAccountJson<CustomerAddress>(editing ? `/me/addresses/${editing.id}` : "/me/addresses", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(input),
      });
      const next = editing ? addresses.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...addresses];
      update(saved.isDefault ? next.map((item) => (item.id === saved.id ? item : { ...item, isDefault: false })) : next);
      setEditing(null);
      setFormOpen(false);
      setMessage(editing ? "La dirección se actualizó." : "La dirección se guardó.");
      notifySessionChanged();
    } catch (cause) {
      setError(errorMessage(cause, "No pudimos guardar la dirección. Revisá los datos y volvé a intentarlo."));
    } finally {
      setSaving(false);
    }
  }
  async function remove(address: CustomerAddress) {
    setDeletingId(address.id);
    setError(null);
    setMessage(null);
    try {
      await requestAccountJson(`/me/addresses/${address.id}`, { method: "DELETE" });
      update(addresses.filter((item) => item.id !== address.id));
      setMessage(`La dirección “${address.label}” se eliminó.`);
      setConfirmingId(null);
      notifySessionChanged();
    } catch (cause) {
      setError(errorMessage(cause, "No pudimos eliminar la dirección. Volvé a intentarlo."));
    } finally {
      setDeletingId(null);
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Direcciones guardadas</h2>
          <p className="mt-1 text-sm text-muted">Marcá como principal la que quieras usar primero al comprar.</p>
        </div>
        <button
          type="button"
          aria-expanded={formOpen}
          aria-controls="address-editor"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-blue px-4 font-semibold text-white"
        >
          Agregar dirección
        </button>
      </div>
      {formOpen ? (
        <AddressForm
          editing={editing}
          saving={saving}
          onSubmit={save}
          onClose={() => {
            setEditing(null);
            setFormOpen(false);
          }}
        />
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {addresses.map((address) => (
          <article key={address.id} className="rounded-2xl border border-catalog-line bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="break-words font-display text-xl font-semibold">
                  {address.label}
                  {address.isDefault ? " · Principal" : ""}
                </h3>
                <p className="mt-2 text-muted">
                  {address.street} {address.number}
                  {address.apartment ? `, ${address.apartment}` : ""}
                </p>
                <p className="text-sm text-muted">
                  {address.neighborhood ? `${address.neighborhood}, ` : ""}
                  {address.city}, {address.province} · {address.postalCode}
                </p>
                <p className="mt-2 text-sm text-muted">Recibe los pedidos: {address.recipientName}</p>
              </div>
              <MapPin size={22} className="shrink-0 text-brand-blue" aria-hidden="true" />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
              <button
                type="button"
                aria-label={`Editar dirección ${address.label}`}
                aria-expanded={formOpen && editing?.id === address.id}
                aria-controls="address-editor"
                onClick={() => {
                  setEditing(address);
                  setFormOpen(true);
                }}
                className="inline-flex min-h-11 items-center gap-1 text-brand-blue"
              >
                <PencilSimple size={16} aria-hidden="true" />
                Editar
              </button>
              {confirmingId === address.id ? (
                <div
                  className="flex w-full flex-wrap items-center gap-2 rounded-xl bg-error-surface px-3 py-2 text-sm"
                  role="group"
                  aria-label={`Confirmar eliminación de ${address.label}`}
                >
                  <span className="mr-auto min-w-0 text-error">¿Eliminarla? Ya no podrás elegirla al comprar.</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="min-h-10 px-2 font-semibold text-muted hover:text-ink"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(address)}
                    disabled={deletingId === address.id}
                    className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-error px-3 font-semibold text-white disabled:opacity-60"
                  >
                    <Trash size={16} aria-hidden="true" />
                    {deletingId === address.id ? "Eliminando…" : "Eliminar dirección"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={`Eliminar dirección ${address.label}`}
                  onClick={() => setConfirmingId(address.id)}
                  disabled={deletingId === address.id}
                  className="inline-flex min-h-11 items-center gap-1 text-muted hover:text-error disabled:opacity-60"
                >
                  <Trash size={16} aria-hidden="true" />
                  Eliminar
                </button>
              )}
            </div>
          </article>
        ))}
        {!addresses.length ? (
          <div className="rounded-2xl border border-dashed border-catalog-line bg-white p-7 md:col-span-2">
            <MapPin size={30} className="text-brand-blue" aria-hidden="true" />
            <h2 className="mt-3 font-display text-xl font-semibold">Agregá tu primera dirección</h2>
            <p className="mt-1 text-muted">Guardala ahora para elegirla más rápido en tu próxima compra.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AddressForm({
  editing,
  saving,
  onSubmit,
  onClose,
}: {
  editing: CustomerAddress | null;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const apartment = splitApartment(editing?.apartment);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      headingRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editing?.id]);
  function selectAddress(selection: GoogleAddressSelection) {
    if (saving) return;
    const form = formRef.current;
    if (!form) return;
    for (const name of ["street", "number", "city", "province", "postalCode", "neighborhood"] as const) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement) field.value = selection[name] ?? "";
    }
    for (const name of ["floor", "department", "reference"]) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement) field.value = name === "department" ? (selection.apartment ?? "") : "";
    }
    (form.elements.namedItem("floor") as HTMLInputElement | null)?.focus();
  }
  return (
    <form
      ref={formRef}
      id="address-editor"
      key={editing?.id ?? "new-address"}
      onSubmit={onSubmit}
      aria-busy={saving}
      className="scroll-mt-40 rounded-2xl border border-catalog-line bg-white p-5 sm:p-6 lg:scroll-mt-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-semibold outline-none">
            {editing ? "Editar dirección" : "Agregar dirección"}
          </h2>
          <p className="mt-1 text-sm text-muted">Completá los datos que necesitamos para entregar tu pedido.</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
      <div className="mt-5">
        <GoogleAddressAutocomplete onSelect={selectAddress} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AddressField name="label" label="Nombre de la dirección" defaultValue={editing?.label} placeholder="Ej.: Casa" maxLength={80} />
        <AddressField name="recipientName" label="Quién recibe" defaultValue={editing?.recipientName} maxLength={160} />
        <AddressField name="street" label="Calle" defaultValue={editing?.street} maxLength={120} />
        <AddressField name="number" label="Número" defaultValue={editing?.number} maxLength={30} />
        <AddressField name="city" label="Ciudad" defaultValue={editing?.city ?? "Buenos Aires"} maxLength={100} />
        <AddressField name="province" label="Provincia" defaultValue={editing?.province ?? "Buenos Aires"} maxLength={100} />
        <AddressField name="postalCode" label="Código postal" defaultValue={editing?.postalCode} maxLength={20} />
        <label className="flex min-h-11 items-center gap-2 self-end text-sm font-semibold">
          <input name="isDefault" type="checkbox" defaultChecked={editing?.isDefault} className="size-4 accent-brand-blue" />
          Usar como dirección principal
        </label>
      </div>
      <div className="mt-5 rounded-xl bg-catalog-canvas px-4">
        <p className="py-3 text-sm font-semibold">Datos adicionales (opcionales)</p>
        <div className="grid gap-3 pb-4 pt-1 sm:grid-cols-2">
          <AddressField
            name="phone"
            label="Teléfono de contacto"
            type="tel"
            defaultValue={editing?.phone ?? ""}
            required={false}
            maxLength={40}
          />
          <AddressField name="floor" label="Piso" defaultValue={apartment.floor} required={false} maxLength={80} />
          <AddressField name="department" label="Departamento" defaultValue={apartment.department} required={false} maxLength={50} />
          <AddressField
            name="neighborhood"
            label="Barrio / localidad"
            defaultValue={editing?.neighborhood ?? ""}
            required={false}
            maxLength={120}
          />
          <AddressField
            name="reference"
            label="Indicaciones para entregar"
            defaultValue={editing?.reference ?? ""}
            required={false}
            maxLength={240}
          />
        </div>
      </div>
      <FormActions saving={saving} label="Guardar dirección" onCancel={onClose} />
    </form>
  );
}

function Pets({
  request,
  pets,
  setMessage,
  setError,
}: {
  request: AccountRequest;
  pets: CustomerPet[];
  setMessage: (value: string | null) => void;
  setError: (value: string | null) => void;
}) {
  const account = useAccount();
  const [editing, setEditing] = useState<CustomerPet | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const data = new FormData(event.currentTarget);
    const input: CustomerPetInput = {
      name: String(data.get("name") ?? "").trim(),
      species: String(data.get("species")) as CustomerPet["species"],
      weightKg: String(data.get("weightKg") ?? "")
        .replace(",", ".")
        .trim(),
      lifeStage: String(data.get("lifeStage")) as CustomerPet["lifeStage"],
      breed: optionalValue(data.get("breed")),
    };
    try {
      const saved = await requestAccountJson<CustomerPet>(editing ? `/me/pets/${editing.id}` : "/me/pets", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(input),
      });
      const next = editing ? pets.map((pet) => (pet.id === saved.id ? saved : pet)) : [saved, ...pets];
      account.updateScreen(request, (current) => ({ ...current, section: { type: "pets", pets: next } }));
      notifyPetsChanged();
      setEditing(null);
      setFormOpen(false);
      setMessage(editing ? `Los datos de ${saved.name} se actualizaron.` : `${saved.name} se agregó a tus mascotas.`);
    } catch (cause) {
      setError(errorMessage(cause, "No pudimos guardar la mascota. Revisá los datos y volvé a intentarlo."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Perfiles guardados</h2>
          <p className="mt-1 text-sm text-muted">Usamos estos datos para calcular porciones y fechas de reposición.</p>
        </div>
        <button
          type="button"
          aria-expanded={formOpen}
          aria-controls="pet-editor"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-blue px-4 font-semibold text-white"
        >
          Agregar mascota
        </button>
      </div>
      {formOpen ? (
        <PetForm
          editing={editing}
          saving={saving}
          onSubmit={save}
          onClose={() => {
            setEditing(null);
            setFormOpen(false);
          }}
        />
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {pets.map((pet) => (
          <article key={pet.id} className="rounded-2xl border border-catalog-line bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="break-words font-display text-xl font-semibold">{pet.name}</h2>
                <p className="mt-1 text-muted">
                  {pet.species === "dog" ? "Perro" : "Gato"} · {pet.weightKg} kg
                </p>
                <p className="text-sm text-muted">
                  {lifeStageLabel(pet.lifeStage)}
                  {pet.breed ? ` · ${pet.breed}` : ""}
                </p>
                <p className="mt-3 text-sm">
                  <span className="font-semibold text-ink">Alimento actual:</span>{" "}
                  <span className="text-muted">
                    {pet.currentFood ? `${pet.currentFood.brand} ${pet.currentFood.name}` : "Sin alimento actual"}
                  </span>
                </p>
              </div>
              <PawPrint size={24} className="shrink-0 text-brand-blue" aria-hidden="true" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <button
                type="button"
                aria-label={`Editar datos de ${pet.name}`}
                aria-expanded={formOpen && editing?.id === pet.id}
                aria-controls="pet-editor"
                onClick={() => {
                  setEditing(pet);
                  setFormOpen(true);
                }}
                className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-blue"
              >
                <PencilSimple size={16} aria-hidden="true" />
                Editar datos
              </button>
              <Link
                href={
                  pet.currentFood
                    ? `/buscar?q=${encodeURIComponent(`${pet.currentFood.brand} ${pet.currentFood.name}`)}`
                    : pet.species === "dog"
                      ? "/perros/alimentos-balanceados"
                      : "/gatos/alimentos-balanceados"
                }
                className="inline-flex min-h-10 items-center text-sm font-semibold text-ink hover:text-brand-blue"
              >
                {pet.currentFood ? "Buscar su alimento" : "Elegir su alimento"}
              </Link>
            </div>
          </article>
        ))}
        {!pets.length ? (
          <div className="rounded-2xl border border-dashed border-catalog-line bg-white p-7 md:col-span-2">
            <PawPrint size={30} className="text-brand-blue" aria-hidden="true" />
            <h2 className="mt-3 font-display text-xl font-semibold">Agregá tu primera mascota</h2>
            <p className="mt-1 text-muted">Sus datos nos ayudan a calcular porciones y fechas de reposición.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PetForm({
  editing,
  saving,
  onSubmit,
  onClose,
}: {
  editing: CustomerPet | null;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      headingRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editing?.id]);
  return (
    <form
      ref={formRef}
      id="pet-editor"
      key={editing?.id ?? "new-pet"}
      onSubmit={onSubmit}
      aria-busy={saving}
      className="scroll-mt-40 rounded-2xl border border-catalog-line bg-white p-5 sm:p-6 lg:scroll-mt-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-semibold outline-none">
            {editing ? `Editar a ${editing.name}` : "Agregar mascota"}
          </h2>
          <p className="mt-1 text-sm text-muted">El peso y la etapa de vida nos ayudan a calcular cuánto alimento necesita.</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AddressField name="name" label="Nombre" defaultValue={editing?.name} maxLength={80} />
        <SelectField
          name="species"
          label="Especie"
          defaultValue={editing?.species ?? "dog"}
          options={[
            ["dog", "Perro"],
            ["cat", "Gato"],
          ]}
        />
        <AddressField
          name="weightKg"
          label="Peso (kg)"
          inputMode="decimal"
          pattern="[0-9]+([.,][0-9]{1,2})?"
          defaultValue={editing?.weightKg ?? ""}
          maxLength={8}
        />
        <SelectField
          name="lifeStage"
          label="Etapa de vida"
          defaultValue={editing?.lifeStage ?? "adult"}
          options={[
            ["puppy", "Cachorro"],
            ["adult", "Adulto"],
            ["senior", "Senior"],
          ]}
        />
      </div>
      <details className="mt-5 rounded-xl bg-catalog-canvas px-4">
        <summary className="cursor-pointer py-3 text-sm font-semibold">Agregar raza (opcional)</summary>
        <div className="pb-4 pt-1">
          <AddressField name="breed" label="Raza" defaultValue={editing?.breed ?? ""} required={false} maxLength={80} />
        </div>
      </details>
      <FormActions saving={saving} label="Guardar mascota" onCancel={onClose} />
    </form>
  );
}

function Replenishments({
  request,
  plans,
  setMessage,
  setError,
}: {
  request: AccountRequest;
  plans: ReplenishmentPlanSummary[];
  setMessage: (value: string | null) => void;
  setError: (value: string | null) => void;
}) {
  const account = useAccount();
  const { refresh: refreshCart } = useCart();
  const router = useRouter();
  const [reordering, setReordering] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  async function reorder(planId: string) {
    setReordering(planId);
    setMessage(null);
    setError(null);
    try {
      await requestAccountJson(`/replenishment-plans/${planId}/reorder-cart`, { method: "POST" });
      await refreshCart();
      router.push("/carrito");
    } catch (cause) {
      setError(errorMessage(cause, "No pudimos agregar estos productos al carrito. Volvé a intentarlo."));
      setReordering(null);
    }
  }
  async function updateStatus(plan: ReplenishmentPlanSummary) {
    const nextStatus = plan.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setUpdatingId(plan.id);
    setMessage(null);
    setError(null);
    try {
      const saved = await requestAccountJson<{ status: string }>(`/replenishment-plans/${plan.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      account.updateScreen(request, (current) => ({
        ...current,
        section:
          current.section.type === "replenishments"
            ? {
                type: "replenishments",
                replenishments: plans.map((item) => (item.id === plan.id ? { ...item, status: saved.status } : item)),
              }
            : current.section,
      }));
      setMessage(nextStatus === "ACTIVE" ? "La reposición se reactivó." : "La reposición quedó pausada.");
    } catch (cause) {
      setError(errorMessage(cause, "No pudimos cambiar el estado de la reposición. Volvé a intentarlo."));
    } finally {
      setUpdatingId(null);
    }
  }
  if (!plans.length)
    return (
      <div className="rounded-2xl border border-catalog-line bg-white p-7">
        <ArrowClockwise size={30} className="text-brand-blue" aria-hidden="true" />
        <h2 className="mt-3 font-display text-xl font-semibold">Todavía no tenés reposiciones</h2>
        <p className="mt-1 text-muted">Organizá una para saber cuándo se terminaría el alimento y recibir un recordatorio.</p>
        <Link href="/reponer" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand-blue px-4 font-semibold text-white">
          Organizar una reposición
        </Link>
      </div>
    );
  return (
    <div className="grid gap-3">
      {plans.map((plan) => (
        <article key={plan.id} className="rounded-2xl border border-catalog-line bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-muted">{plan.petName}</p>
              <h2 className="mt-1 break-words font-display text-xl font-semibold">{plan.productName ?? plan.presentation ?? "Alimento"}</h2>
              <p className="mt-2 text-sm text-muted">Se estima que alcanza hasta el {formatAccountDate(plan.estimatedDepletionDate)}</p>
            </div>
            <span className="rounded-full bg-soft-blue px-3 py-1 text-xs font-semibold text-brand-blue">
              {replenishmentStatus(plan.status)}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {plan.status === "ACTIVE" || plan.status === "PAUSED" ? (
              <button
                type="button"
                aria-label={`${plan.status === "ACTIVE" ? "Pausar" : "Reactivar"} reposición de ${plan.productName ?? plan.presentation ?? "alimento"}`}
                onClick={() => void updateStatus(plan)}
                disabled={updatingId === plan.id}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-catalog-canvas px-4 font-semibold text-ink disabled:opacity-60"
              >
                {updatingId === plan.id ? "Actualizando…" : plan.status === "ACTIVE" ? "Pausar reposición" : "Reactivar reposición"}
              </button>
            ) : null}
            <button
              type="button"
              aria-label={`Volver a pedir ${plan.productName ?? plan.presentation ?? "alimento"}`}
              onClick={() => void reorder(plan.id)}
              disabled={reordering === plan.id || updatingId === plan.id}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-blue px-4 font-semibold text-white disabled:opacity-60"
            >
              <ArrowClockwise size={17} aria-hidden="true" />
              {reordering === plan.id ? "Armando carrito…" : "Volver a pedir"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Orders({ orders, detail, meta }: { orders: OrderListItem[]; detail: OrderSummary | null; meta?: AccountOrdersSection["meta"] }) {
  if (detail)
    return (
      <article className="rounded-2xl border border-catalog-line bg-white p-5 sm:p-7">
        <Link href="/mi-cuenta/pedidos" className="text-sm font-semibold text-brand-blue">
          ← Volver a tus pedidos
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Pedido #{detail.number ?? detail.id}</h2>
            <p className="mt-2 text-sm text-muted">
              {orderStatus(detail.status)} · {formatAccountDate(detail.createdAt)}
            </p>
          </div>
          <PaymentBadge status={detail.paymentStatus} />
        </div>
        {detail.reconciliationRequired ? (
          <p className="mt-5 rounded-xl bg-warning-surface p-4 text-sm text-warning">
            Este pago necesita revisión. Para evitar un cobro duplicado, no intentes pagarlo de nuevo.
          </p>
        ) : null}
        <ul className="mt-6 divide-y divide-catalog-line">
          {detail.lines.map((line) => (
            <li key={line.variantId} className="flex justify-between gap-4 py-3">
              <span className="min-w-0 break-words">
                {line.quantity} × {line.productName}
                {line.presentation ? ` · ${line.presentation}` : ""}
              </span>
              <span className="shrink-0 tabular-nums">{formatMoney(Number(line.lineTotal))}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between border-t border-catalog-line pt-5 font-semibold">
          <span>Total</span>
          <span>{formatMoney(Number(detail.total))}</span>
        </div>
        {detail.shipment ? (
          <section className="mt-6 rounded-xl bg-soft-blue p-4">
            <p className="text-sm font-semibold">Entrega: {shipmentStatusLabel(detail.shipment.status)}</p>
            {detail.shipment.trackingNumber ? <p className="mt-1 text-sm text-muted">Seguimiento: {detail.shipment.trackingNumber}</p> : null}
            <ol className="mt-3 space-y-2 text-sm text-muted">
              {detail.shipment.events.map((event) => <li key={event.id}><strong>{shipmentStatusLabel(event.status)}</strong> · {event.visibleMessage}</li>)}
            </ol>
            {detail.shipment.trackingUrl ? <a className="mt-3 inline-block text-sm font-semibold text-brand-blue" href={detail.shipment.trackingUrl} target="_blank" rel="noreferrer">Ver seguimiento</a> : null}
          </section>
        ) : null}
        <OrderClaimForm orderId={detail.id} />
        {detail.canRetry && !detail.reconciliationRequired ? <OrderRetryButton orderId={detail.id} /> : null}
      </article>
    );
  return (
    <div className="grid gap-3">
      {orders.length ? (
        orders.map((item) => (
          <Link
            key={item.id}
            href={`/mi-cuenta/pedidos/${item.id}`}
            className="rounded-2xl border border-catalog-line bg-white p-5 transition-colors hover:bg-soft-blue"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words font-display text-xl font-semibold">Pedido {item.number ?? item.id}</h2>
                <p className="mt-1 text-sm text-muted">
                  {formatAccountDate(item.createdAt)} · {orderStatus(item.status)}
                </p>
              </div>
              <PaymentBadge status={item.paymentStatus} />
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-sm text-muted">
                {item.lineCount} {item.lineCount === 1 ? "producto" : "productos"}
              </p>
              <strong className="tabular-nums">{formatMoney(Number(item.total))}</strong>
            </div>
          </Link>
        ))
      ) : (
        <div className="rounded-2xl border border-catalog-line bg-white p-7">
          <Package size={32} className="text-brand-blue" aria-hidden="true" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Todavía no tenés pedidos</h2>
          <Link href="/" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-brand-blue px-5 font-semibold text-white">
            Explorar productos
          </Link>
        </div>
      )}
      {meta && meta.totalPages > 1 ? (
        <nav aria-label="Paginación de pedidos" className="mt-4 flex items-center justify-center gap-3">
          <Link
            aria-disabled={meta.page <= 1}
            tabIndex={meta.page <= 1 ? -1 : undefined}
            href={`/mi-cuenta/pedidos?page=${Math.max(1, meta.page - 1)}`}
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${meta.page <= 1 ? "pointer-events-none opacity-40" : "bg-white hover:text-brand-blue"}`}
          >
            Anterior
          </Link>
          <span className="text-sm text-muted">
            Página {meta.page} de {meta.totalPages}
          </span>
          <Link
            aria-disabled={meta.page >= meta.totalPages}
            tabIndex={meta.page >= meta.totalPages ? -1 : undefined}
            href={`/mi-cuenta/pedidos?page=${Math.min(meta.totalPages, meta.page + 1)}`}
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${meta.page >= meta.totalPages ? "pointer-events-none opacity-40" : "bg-white hover:text-brand-blue"}`}
          >
            Siguiente
          </Link>
        </nav>
      ) : null}
    </div>
  );
}

function OrderClaimForm({ orderId }: { orderId: string }) {
  const [type, setType] = useState("DELIVERY_DELAY");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    try { await requestAccountJson(`/me/orders/${encodeURIComponent(orderId)}/claims`, { method: "POST", body: JSON.stringify({ type, message }) }); setSent(true); setMessage(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos enviar el reclamo."); }
  }
  return <form onSubmit={submit} className="mt-6 border-t border-catalog-line pt-5"><p className="text-sm font-semibold">¿Necesitás ayuda con este pedido?</p><div className="mt-3 flex flex-wrap gap-3"><select value={type} onChange={(event) => setType(event.target.value)} className="rounded-xl border border-catalog-line p-3 text-sm"><option value="DELIVERY_DELAY">Demora en la entrega</option><option value="ADDRESS_CHANGE">Cambiar dirección</option><option value="MISSING_PACKAGE">Paquete faltante</option><option value="DAMAGED_PACKAGE">Paquete dañado</option><option value="OTHER">Otro motivo</option></select><input required minLength={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Contanos qué pasó" className="min-w-52 flex-1 rounded-xl border border-catalog-line p-3 text-sm" /><button className="rounded-xl bg-brand-blue px-4 py-3 text-sm font-semibold text-white">Enviar consulta</button></div>{sent ? <p className="mt-2 text-sm text-brand-blue">Recibimos tu consulta.</p> : null}{error ? <p role="alert" className="mt-2 text-sm text-[#8d2020]">{error}</p> : null}</form>;
}

function OrderRetryButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function retry() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/commerce/payments/orders/${encodeURIComponent(orderId)}/link`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
      });
      const payload = (await response.json().catch(() => null)) as {
        action?: "REDIRECT" | "NONE" | "RETRY";
        paymentUrl?: string | null;
        message?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.message ?? "No pudimos iniciar otro intento de pago.");
      if (payload?.action === "NONE") {
        window.location.reload();
        return;
      }
      const url =
        payload?.action && payload.paymentUrl !== undefined
          ? paymentRedirectUrl({ action: payload.action, paymentUrl: payload.paymentUrl })
          : null;
      if (!url) throw new Error("No pudimos abrir Mercado Pago. Volvé a intentarlo.");
      window.location.assign(url);
    } catch (cause) {
      setError(errorMessage(cause, "No pudimos iniciar otro intento de pago."));
      setLoading(false);
    }
  }
  return (
    <div className="mt-5">
      {error ? (
        <p role="alert" className="mb-3 rounded-lg bg-error-surface p-3 text-sm text-error">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void retry()}
        disabled={loading}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-blue px-4 font-semibold text-white disabled:opacity-60"
      >
        <ArrowClockwise size={17} aria-hidden="true" />
        {loading ? "Abriendo pago…" : "Reintentar pago"}
      </button>
    </div>
  );
}

function PaymentBadge({ status }: { status: OrderSummary["paymentStatus"] }) {
  const positive = status === "PAID";
  const pending = status === "PENDING" || status === "PROCESSING";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${positive ? "bg-success-surface text-success" : pending ? "bg-warning-surface text-warning" : "bg-catalog-canvas text-muted"}`}
    >
      {paymentStatusLabel(status)}
    </span>
  );
}

function AuthPanel() {
  const account = useAccount();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [resendTurnstileToken, setResendTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [resendTurnstileResetKey, setResendTurnstileResetKey] = useState(0);
  const isLogin = mode === "login";

  function switchMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setResendMessage(null);
    setConfirmation("");
    setTurnstileToken(null);
    setResendTurnstileToken(null);
    setTurnstileResetKey((current) => current + 1);
    setResendTurnstileResetKey((current) => current + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResendMessage(null);
    if (isTurnstileConfigured && !turnstileToken) {
      setError("Completá la verificación de seguridad para continuar.");
      setLoading(false);
      return;
    }
    if (!isLogin && password !== confirmation) {
      setError("Las contraseñas no coinciden. Revisá ambos campos.");
      setLoading(false);
      return;
    }
    try {
      const result = await requestAuthJson<{ status: "authenticated" | "verification_required" }>(`/${mode}`, {
        method: "POST",
        headers: turnstileToken ? { "X-Turnstile-Token": turnstileToken } : undefined,
        body: JSON.stringify({ email, password }),
      });
      if (result.status === "verification_required") {
        setMessage("Revisá tu correo para verificar la cuenta. Después volvé a iniciar sesión.");
        return;
      }
      notifySessionChanged();
      await account.refreshCurrent();
    } catch (cause) {
      setTurnstileToken(null);
      setTurnstileResetKey((current) => current + 1);
      setError(
        errorMessage(cause, isLogin ? "No pudimos iniciar sesión. Volvé a intentarlo." : "No pudimos crear tu cuenta. Volvé a intentarlo."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Ingresá tu email para reenviar el correo de confirmación.");
      return;
    }
    setResendLoading(true);
    setError(null);
    setResendMessage(null);
    if (isTurnstileConfigured && !resendTurnstileToken) {
      setError("Completá la verificación de seguridad para reenviar el correo.");
      setResendLoading(false);
      return;
    }
    try {
      const result = await requestAuthJson<{ message: string }>("/email-confirmation/resend", {
        method: "POST",
        headers: resendTurnstileToken ? { "X-Turnstile-Token": resendTurnstileToken } : undefined,
        body: JSON.stringify({ email: normalizedEmail }),
      });
      setResendMessage(result.message || "Si la cuenta requiere confirmación, enviaremos un correo.");
      setResendTurnstileToken(null);
      setResendTurnstileResetKey((current) => current + 1);
    } catch (cause) {
      setResendTurnstileToken(null);
      setResendTurnstileResetKey((current) => current + 1);
      setError(errorMessage(cause, "No pudimos reenviar el correo de confirmación. Volvé a intentarlo."));
    } finally {
      setResendLoading(false);
    }
  }
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,27rem)] lg:gap-8">
      <section className="relative overflow-hidden rounded-2xl bg-brand-blue p-6 text-white sm:p-8">
        <div className="relative z-10 max-w-xl">
          <PawPrint size={34} weight="duotone" className="text-brand-yellow" aria-hidden="true" />
          <h1 className="mt-8 max-w-lg font-display text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
            Tus compras y mascotas, en orden.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-6 text-white/95 sm:text-lg sm:leading-7">
            Consultá tus pedidos y guardá los datos que necesitás para comprar y reponer con menos pasos.
          </p>
          <ul className="mt-7 grid gap-3 text-sm text-white/90">
            <li className="flex items-start gap-3">
              <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-brand-yellow" aria-hidden="true" />
              Seguí el estado y el pago de cada compra.
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-brand-yellow" aria-hidden="true" />
              Elegí una dirección guardada al comprar.
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-brand-yellow" aria-hidden="true" />
              Consultá cuándo se terminaría cada producto.
            </li>
          </ul>
        </div>
        <PawPrint size={180} weight="thin" className="absolute -bottom-12 -right-10 rotate-[-15deg] text-white/10" aria-hidden="true" />
      </section>
      <section className="rounded-2xl border border-catalog-line bg-white p-5 sm:p-7">
        <div className="grid grid-cols-2 rounded-xl bg-catalog-canvas p-1" role="group" aria-label="Acceso a tu cuenta">
          <button
            type="button"
            onClick={() => switchMode("login")}
            disabled={loading}
            aria-pressed={isLogin}
            className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors ${isLogin ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            disabled={loading}
            aria-pressed={!isLogin}
            className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors ${!isLogin ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            Crear cuenta
          </button>
        </div>
        <h2 className="mt-6 font-display text-2xl font-semibold tracking-[-0.02em]">
          {isLogin ? "Ingresá a tu cuenta" : "Creá tu cuenta Patitas"}
        </h2>
        <p className="mt-2 text-muted">
          {isLogin
            ? "Consultá tus pedidos, mascotas, direcciones y reposiciones."
            : "Registrate con tu correo para guardar tus datos y compras."}
        </p>
        <form onSubmit={submit} aria-busy={loading} className="mt-6 grid gap-4">
          <AddressField
            name="email"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={160}
          />
          <PasswordField
            name="password"
            label="Contraseña"
            visible={showPassword}
            onToggle={() => setShowPassword((current) => !current)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            helperText={!isLogin ? "Usá al menos 8 caracteres." : undefined}
          />
          {isLogin ? (
            <Link
              href="/auth/forgot-password"
              className="-mt-1 justify-self-start text-sm font-semibold text-brand-blue underline-offset-4 hover:underline"
            >
              Restablecer contraseña
            </Link>
          ) : null}
          {!isLogin ? (
            <PasswordField
              name="confirmation"
              label="Repetí la contraseña"
              visible={showConfirmation}
              onToggle={() => setShowConfirmation((current) => !current)}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          ) : null}
          <TurnstileWidget
            action={isLogin ? "auth-login" : "auth-register"}
            resetKey={turnstileResetKey}
            onToken={setTurnstileToken}
          />
          {error ? (
            <p role="alert" className="rounded-lg bg-error-surface p-3 text-sm text-error">
              {error}
            </p>
          ) : null}
          {!isLogin && error ? (
            <>
              <TurnstileWidget
                action="auth-email-confirmation-resend"
                resetKey={resendTurnstileResetKey}
                onToken={setResendTurnstileToken}
              />
              <button
                type="button"
                onClick={() => void resendConfirmation()}
                disabled={loading || resendLoading}
                className="justify-self-start text-left text-sm font-semibold text-brand-blue underline-offset-4 hover:underline disabled:opacity-60"
              >
                {resendLoading ? "Reenviando correo…" : "Reenviar correo de confirmación"}
              </button>
            </>
          ) : null}
          {resendMessage ? (
            <p role="status" className="rounded-lg bg-soft-blue p-3 text-sm text-ink">
              {resendMessage}
            </p>
          ) : null}
          {message ? (
            <p role="status" className="rounded-lg bg-soft-blue p-3 text-sm text-ink">
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white disabled:opacity-60"
          >
            {loading ? (isLogin ? "Ingresando…" : "Creando cuenta…") : isLogin ? "Entrar a mi cuenta" : "Crear mi cuenta"}
            <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </button>
        </form>
      </section>
    </div>
  );
}

function PasswordField({
  name,
  label,
  visible,
  onToggle,
  autoComplete,
  value,
  onChange,
  helperText,
}: {
  name: string;
  label: string;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  helperText?: string;
}) {
  const Icon = visible ? EyeSlash : Eye;
  const helpId = helperText ? `auth-${name}-help` : undefined;
  return (
    <div>
      <label htmlFor={`auth-${name}`} className="text-sm font-semibold">
        {label}
      </label>
      <span className="relative mt-1 block">
        <input
          id={`auth-${name}`}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={8}
          autoComplete={autoComplete}
          aria-describedby={helpId}
          value={value}
          onChange={onChange}
          maxLength={160}
          className="h-12 w-full rounded-xl border border-catalog-line px-3 pr-12 font-normal focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted hover:text-ink"
        >
          <Icon size={19} aria-hidden="true" />
        </button>
      </span>
      {helperText ? (
        <span id={helpId} className="mt-1 block text-sm font-normal text-muted">
          {helperText}
        </span>
      ) : null}
    </div>
  );
}

function AddressField({
  name,
  label,
  required = true,
  className = "",
  ...props
}: { name: string; label: string; required?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        name={name}
        required={required}
        {...props}
        className={`mt-1 h-12 w-full rounded-xl border border-catalog-line px-3 text-base font-normal focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${className}`}
      />
    </label>
  );
}
function SelectField({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: Array<[string, string]>;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1 h-14 w-full rounded-xl border border-catalog-line bg-white px-3 font-normal focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
function FormActions({ saving, label, onCancel }: { saving: boolean; label: string; onCancel: () => void }) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Guardando…" : label}
        <CheckCircle size={17} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-catalog-canvas px-4 font-semibold"
      >
        Cancelar
      </button>
    </div>
  );
}
function AccountSectionSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-white" />
      <div className="h-40 animate-pulse rounded-2xl bg-white" />
      <div className="h-40 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
function SectionLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="rounded-2xl border border-catalog-line bg-white p-6">
      <h2 className="font-display text-xl font-semibold">No pudimos mostrar esta sección</h2>
      <p role="alert" className="mt-2 text-muted">
        {message}
      </p>
      <button type="button" onClick={onRetry} className="mt-5 min-h-11 rounded-xl bg-brand-blue px-4 font-semibold text-white">
        Volver a intentar
      </button>
    </section>
  );
}
function AccountLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="max-w-xl rounded-2xl border border-catalog-line bg-white p-6">
      <h2 className="font-display text-xl font-semibold">No pudimos cargar tu cuenta</h2>
      <p role="alert" className="mt-2 text-muted">
        {message}
      </p>
      <button type="button" onClick={onRetry} className="mt-5 min-h-11 rounded-xl bg-brand-blue px-4 font-semibold text-white">
        Volver a intentar
      </button>
    </section>
  );
}
function optionalValue(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}
function locationFromAddresses(addresses: CustomerAddress[]): StorefrontLocation | null {
  const address = addresses.find((item) => item.isDefault) ?? addresses[0];
  return address
    ? {
        label: address.label,
        street: address.street,
        number: address.number,
        apartment: address.apartment,
        neighborhood: address.neighborhood,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
      }
    : null;
}
function lifeStageLabel(stage: CustomerPet["lifeStage"]) {
  return ({ puppy: "Cachorro", adult: "Adulto", senior: "Senior" } as const)[stage];
}
function replenishmentStatus(status: string) {
  return (
    ({ ACTIVE: "Activa", PAUSED: "Pausada", CANCELLED: "Cancelada", NEEDS_REVIEW: "Necesita revisión" } as Record<string, string>)[
      status
    ] ?? "Estado no disponible"
  );
}

function formatAccountDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es-AR").format(date);
}

function orderStatus(status: string) {
  return (
    (
      {
        DRAFT: "Borrador",
        PENDING_PAYMENT: "Pendiente de pago",
        PAID: "Pagado",
        PROCESSING: "En preparación",
        SHIPPED: "Enviado",
        DELIVERED: "Entregado",
        CANCELLED: "Cancelado",
      } as Record<string, string>
    )[status] ?? "Estado no disponible"
  );
}
function shipmentStatusLabel(status: string) {
  return ({ PENDING: "Recibido", PREPARING: "Preparando", READY_FOR_DISPATCH: "Listo para despachar", SHIPPED: "Despachado", OUT_FOR_DELIVERY: "En camino", DELIVERED: "Entregado", FAILED: "Incidencia", RETURNED: "Devuelto" } as Record<string, string>)[status] ?? "Estado no disponible";
}
function sectionMatchesData(section: AccountSection, type: AccountScreen["section"]["type"]) {
  if (section === "pedidos") return type === "orders" || type === "order-detail";
  return (
    (
      { resumen: "overview", direcciones: "addresses", mascotas: "pets", reposiciones: "replenishments" } as Partial<
        Record<AccountSection, AccountScreen["section"]["type"]>
      >
    )[section] === type
  );
}
async function requestAuthJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/auth${path}`, {
    ...init,
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok)
    throw new Error(
      payload && typeof payload === "object" && "message" in payload
        ? payload.message
        : "No pudimos completar la solicitud. Revisá tu conexión y volvé a intentarlo.",
    );
  return payload as T;
}
