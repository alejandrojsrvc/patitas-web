"use client";

import { ArrowClockwise, ArrowRight, CheckCircle, House, MapPin, Package, PawPrint, PencilSimple, SignOut, Trash, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type InputHTMLAttributes, useState } from "react";

import type { CustomerAddress, CustomerAddressInput, CustomerPet, CustomerPetInput, CustomerProfile, CustomerProfileInput, OrderSummary, ReplenishmentPlanSummary } from "@/domain/customer/types";
import type { AccountOrdersSection, AccountScreen } from "@/domain/storefront/types";
import { paymentRedirectUrl, paymentStatusLabel } from "@/features/checkout/payment-flow";
import { formatMoney } from "@/lib/catalog-formatters";
import { notifySessionChanged } from "@/features/session/session-shell-context";

type AccountSection = "resumen" | "pedidos" | "direcciones" | "mascotas" | "reposiciones";

const navigation: Array<{ label: string; href: string; section: AccountSection; Icon: typeof House }> = [
  { label: "Resumen", href: "/mi-cuenta", section: "resumen", Icon: House },
  { label: "Pedidos", href: "/mi-cuenta/pedidos", section: "pedidos", Icon: Package },
  { label: "Direcciones", href: "/mi-cuenta/direcciones", section: "direcciones", Icon: MapPin },
  { label: "Mascotas", href: "/mi-cuenta/mascotas", section: "mascotas", Icon: PawPrint },
  { label: "Reposiciones", href: "/mi-cuenta/reposiciones", section: "reposiciones", Icon: ArrowClockwise },
];

export function AccountPage({
  section,
  initialData,
  initialError,
}: {
  section: AccountSection;
  initialData: AccountScreen | null;
  initialError?: string | null;
}) {
  const router = useRouter();
  const sectionData = initialData?.section;
  const [profile, setProfile] = useState<CustomerProfile | null>(initialData?.profile ?? null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>(sectionData?.type === "addresses" ? sectionData.addresses : []);
  const [orders] = useState<OrderSummary[]>(sectionData?.type === "orders" ? sectionData.orders : sectionData?.type === "overview" ? sectionData.recentOrders : []);
  const [pets, setPets] = useState<CustomerPet[]>(sectionData?.type === "pets" ? sectionData.pets : []);
  const [plans] = useState<ReplenishmentPlanSummary[]>(sectionData?.type === "replenishments" ? sectionData.replenishments : []);
  const [order] = useState<OrderSummary | null>(sectionData?.type === "order-detail" ? sectionData.order : null);
  const orderCount = sectionData?.type === "overview" ? sectionData.orderCount : orders.length;
  const ordersMeta = sectionData?.type === "orders" ? sectionData.meta : undefined;
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const viewer = initialData?.shell.viewer.authenticated ? initialData.shell.viewer : null;

  async function handleLogout() {
    setLoggingOut(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("No pudimos cerrar la sesión.");
      notifySessionChanged(); router.refresh();
    } catch (cause) {
      setError(errorMessage(cause, "No pudimos cerrar la sesión."));
    } finally {
      setLoggingOut(false);
    }
  }

  if (!viewer && initialError) return <AccountLoadError message={initialError} />;
  if (!viewer) return <AuthPanel />;

  const title = section === "pedidos" ? "Mis pedidos" : section === "direcciones" ? "Mis direcciones" : section === "mascotas" ? "Mis mascotas" : section === "reposiciones" ? "Próximas reposiciones" : "Mi cuenta";
  return <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
    <aside className="h-fit rounded-xl bg-white p-3 lg:sticky lg:top-6" aria-label="Mi cuenta">
      <div className="flex items-center gap-3 border-b border-catalog-line px-3 pb-4 pt-2"><span className="flex size-10 items-center justify-center rounded-lg bg-brand-yellow text-ink"><UserCircle size={23} weight="bold" /></span><span className="min-w-0"><strong className="block truncate text-sm">{profile?.fullName || viewer.email}</strong><span className="block truncate text-xs text-muted">{viewer.email}</span></span></div>
      <nav className="mt-2 flex gap-1 overflow-x-auto pb-1 lg:grid" aria-label="Secciones de cuenta">{navigation.map(({ Icon, ...item }) => <Link key={item.href} href={item.href} aria-current={section === item.section ? "page" : undefined} className={`flex min-h-11 min-w-max items-center gap-2 rounded-lg px-3 text-sm font-semibold ${section === item.section ? "bg-brand-yellow text-ink" : "text-muted hover:bg-catalog-canvas hover:text-ink"}`}><Icon size={18} weight={section === item.section ? "bold" : "regular"} aria-hidden="true" />{item.label}</Link>)}</nav>
      <button type="button" onClick={() => void handleLogout()} disabled={loggingOut} className="mt-3 flex min-h-11 w-full items-center gap-2 rounded-lg border-t border-catalog-line px-3 pt-3 text-left text-sm font-semibold text-muted hover:text-ink disabled:opacity-60"><SignOut size={18} /> {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}</button>
    </aside>
    <section className="min-w-0"><h1 className="display-heading text-3xl sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-base text-muted">Gestioná tus datos, pedidos y preferencias desde un solo lugar.</p>{error ? <p role="alert" className="mt-5 rounded-xl bg-[#fff1f1] p-4 text-sm text-[#8d2020]">{error}</p> : null}{message ? <p role="status" className="mt-5 rounded-xl bg-soft-blue p-4 text-sm text-ink">{message}</p> : null}{section === "resumen" ? <Summary profile={profile} orderCount={orderCount} onProfileChange={setProfile} setMessage={setMessage} setError={setError} /> : null}{section === "pedidos" ? <Orders orders={orders} detail={order} meta={ordersMeta} /> : null}{section === "direcciones" ? <Addresses addresses={addresses} onChange={setAddresses} setMessage={setMessage} /> : null}{section === "mascotas" ? <Pets pets={pets} onChange={setPets} setMessage={setMessage} setError={setError} /> : null}{section === "reposiciones" ? <Replenishments plans={plans} setMessage={setMessage} setError={setError} /> : null}</section>
  </div>;
}

function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null); setMessage(null);
    try {
      const result = await requestAuthJson<{ status: "authenticated" | "verification_required" }>(`/${mode}`, { method: "POST", body: JSON.stringify({ email, password }) });
      if (result.status === "verification_required") { setMessage("Revisá tu correo para verificar la cuenta y después iniciá sesión."); return; }
      notifySessionChanged(); router.refresh();
    } catch (cause) { setError(errorMessage(cause, "No pudimos completar la autenticación.")); }
    finally { setLoading(false); }
  }

  return <section className="max-w-xl rounded-xl bg-white p-5 sm:p-8"><div className="flex gap-2 border-b border-catalog-line pb-2"><button type="button" onClick={() => setMode("login")} className={`min-h-11 rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${mode === "login" ? "bg-brand-yellow text-ink" : "text-muted"}`}>Iniciar sesión</button><button type="button" onClick={() => setMode("register")} className={`min-h-11 rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${mode === "register" ? "bg-brand-yellow text-ink" : "text-muted"}`}>Crear cuenta</button></div><h2 className="mt-6 font-display text-2xl font-semibold">{mode === "login" ? "Volvé a tu cuenta" : "Creá tu cuenta Patitas"}</h2><p className="mt-2 text-muted">{mode === "login" ? "Consultá tus pedidos y direcciones guardadas." : "Guardá tus datos y asociá tu carrito después de iniciar sesión."}</p><form onSubmit={submit} className="mt-6 grid gap-4"><label className="font-semibold">Correo electrónico<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-catalog-line px-4 font-normal focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue" /></label><label className="font-semibold">Contraseña<input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-catalog-line px-4 font-normal focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue" /></label>{error ? <p role="alert" className="rounded-lg bg-[#fff1f1] p-3 text-sm text-[#8d2020]">{error}</p> : null}{message ? <p role="status" className="rounded-lg bg-soft-blue p-3 text-sm text-ink">{message}</p> : null}<button type="submit" disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-60">{loading ? "Guardando…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}<ArrowRight size={18} weight="bold" /></button></form></section>;
}

function Summary({ profile, orderCount, onProfileChange, setMessage, setError }: { profile: CustomerProfile | null; orderCount: number; onProfileChange: (profile: CustomerProfile) => void; setMessage: (message: string | null) => void; setError: (message: string | null) => void }) {
  return <div className="mt-7 grid gap-4 sm:grid-cols-2"><ProfileEditor profile={profile} onChange={onProfileChange} setMessage={setMessage} setError={setError} /><div className="rounded-xl bg-soft-blue p-5"><p className="text-sm text-muted">Actividad</p><p className="mt-2 font-display text-4xl font-semibold">{orderCount}</p><p className="text-muted">pedidos registrados</p><Link href="/mi-cuenta/pedidos" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">Ver pedidos <ArrowRight size={16} /></Link></div></div>;
}

function ProfileEditor({ profile, onChange, setMessage, setError }: { profile: CustomerProfile | null; onChange: (profile: CustomerProfile) => void; setMessage: (message: string | null) => void; setError: (message: string | null) => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage(null); setError(null);
    const data = new FormData(event.currentTarget);
    const input: CustomerProfileInput = { fullName: String(data.get("fullName") ?? "").trim(), phone: String(data.get("phone") ?? "").trim() || null };
    try {
      onChange(await requestJson<CustomerProfile>("/me/customer", { method: "PATCH", body: JSON.stringify(input) }));
      notifySessionChanged();
      setEditing(false); setMessage("Datos personales actualizados.");
      router.refresh();
    } catch (cause) { setError(errorMessage(cause, "No pudimos actualizar tus datos.")); }
    finally { setSaving(false); }
  }
  if (editing) return <form onSubmit={save} className="account-modal rounded-xl bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted">Datos personales</p><h2 className="mt-1 font-display text-xl font-semibold">Editar mis datos</h2></div><button type="button" onClick={() => setEditing(false)} className="text-sm font-semibold text-muted hover:text-ink">Cerrar</button></div><div className="mt-5 grid gap-3"><AddressField name="fullName" label="Nombre y apellido" defaultValue={profile?.fullName} /><AddressField name="phone" label="Teléfono" type="tel" defaultValue={profile?.phone ?? ""} required={false} /><p className="text-sm text-muted">{profile?.email}</p></div><div className="mt-5 flex gap-2"><button type="submit" disabled={saving} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-blue px-4 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-60">{saving ? "Guardando…" : "Guardar cambios"}</button><button type="button" onClick={() => setEditing(false)} className="min-h-11 rounded-xl bg-catalog-canvas px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">Cancelar</button></div></form>;
  return <div className="rounded-xl bg-white p-5"><p className="text-sm text-muted">Datos personales</p><h2 className="mt-2 font-display text-2xl font-semibold">{profile?.fullName || "Completá tu nombre"}</h2><p className="mt-1 text-muted">{profile?.email}</p><p className="mt-1 text-muted">{profile?.phone || "Sin teléfono cargado"}</p><button type="button" onClick={() => setEditing(true)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"><PencilSimple size={16} /> Editar mis datos</button></div>;
}

function Pets({ pets, onChange, setMessage, setError }: { pets: CustomerPet[]; onChange: (pets: CustomerPet[]) => void; setMessage: (message: string | null) => void; setError: (message: string | null) => void }) {
  const [editing, setEditing] = useState<CustomerPet | null>(null);
  const [saving, setSaving] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null); setError(null);
    const data = new FormData(event.currentTarget);
    const input: CustomerPetInput = { name: String(data.get("name")), species: String(data.get("species")) as CustomerPet["species"], weightKg: String(data.get("weightKg")).replace(",", "."), lifeStage: String(data.get("lifeStage")) as CustomerPet["lifeStage"], breed: String(data.get("breed") || "") || null };
    try {
      const saved = await requestJson<CustomerPet>(editing ? `/me/pets/${editing.id}` : "/me/pets", { method: editing ? "PATCH" : "POST", body: JSON.stringify(input) });
      onChange(editing ? pets.map((pet) => pet.id === saved.id ? saved : pet) : [saved, ...pets]);
      setEditing(null); setMessage(editing ? "Mascota actualizada." : "Mascota guardada.");
      (event.target as HTMLFormElement).reset();
    } catch (cause) { setError(errorMessage(cause, "No pudimos guardar la mascota.")); }
    finally { setSaving(false); }
  }
  return <div className="mt-7 grid gap-5"><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-semibold">Mis mascotas</h2><p className="mt-1 text-sm text-muted">Personalizá recomendaciones y reposiciones.</p></div><button type="button" onClick={() => setEditing({} as CustomerPet)} className="inline-flex min-h-11 items-center rounded-xl bg-brand-blue px-4 font-semibold text-white">Agregar mascota</button></div><div className="grid gap-3 md:grid-cols-2">{pets.map((pet) => <article key={pet.id} className="rounded-xl bg-white p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">{pet.name}</h2><p className="mt-1 text-muted">{pet.species === "dog" ? "Perro" : "Gato"} · {pet.weightKg} kg</p><p className="text-sm text-muted">{lifeStageLabel(pet.lifeStage)}{pet.breed ? ` · ${pet.breed}` : ""}</p></div><PawPrint size={24} className="shrink-0 text-brand-blue" /></div><button type="button" onClick={() => setEditing(pet)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"><PencilSimple size={16} /> Editar</button></article>)}{!pets.length ? <div className="rounded-xl bg-white p-7 md:col-span-2"><PawPrint size={30} className="text-brand-blue" /><h2 className="mt-3 font-display text-xl font-semibold">Agregá tu primera mascota</h2><p className="mt-1 text-muted">Sus datos se usan para personalizar recomendaciones y reposiciones.</p></div> : null}</div>{editing ? <form key={editing.id || "new-pet"} onSubmit={save} className="account-modal rounded-xl bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">{editing.id ? `Editar a ${editing.name}` : "Nueva mascota"}</h2></div><button type="button" onClick={() => setEditing(null)} className="text-sm font-semibold text-muted hover:text-ink">Cerrar</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><AddressField name="name" label="Nombre" defaultValue={editing.id ? editing.name : ""} /><SelectField name="species" label="Especie" defaultValue={editing.species ?? "dog"} options={[["dog", "Perro"], ["cat", "Gato"]]} /><AddressField name="weightKg" label="Peso (kg)" inputMode="decimal" pattern="[0-9]+([.,][0-9]+)?" defaultValue={editing.weightKg ?? ""} /><SelectField name="lifeStage" label="Etapa" defaultValue={editing.lifeStage ?? "adult"} options={[["puppy", "Cachorro"], ["adult", "Adulto"], ["senior", "Senior"]]} /><AddressField name="breed" label="Raza" defaultValue={editing.breed ?? ""} required={false} /></div><div className="mt-5 flex gap-2"><button type="submit" disabled={saving} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-blue px-4 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-60">{saving ? "Guardando…" : "Guardar"}</button><button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-xl bg-catalog-canvas px-4 font-semibold">Cancelar</button></div></form> : null}</div>;
}

function Replenishments({ plans, setMessage, setError }: { plans: ReplenishmentPlanSummary[]; setMessage: (message: string | null) => void; setError: (message: string | null) => void }) {
  const router = useRouter();
  const [reordering, setReordering] = useState<string | null>(null);
  async function reorder(planId: string) {
    setReordering(planId); setMessage(null); setError(null);
    try {
      await requestJson(`/replenishment-plans/${planId}/reorder-cart`, { method: "POST" });
      router.push("/carrito");
    } catch (cause) { setError(errorMessage(cause, "No pudimos agregar la reposición al carrito.")); setReordering(null); }
  }
  if (!plans.length) return <div className="mt-7 rounded-xl bg-white p-7"><ArrowClockwise size={30} className="text-brand-blue" /><h2 className="mt-3 font-display text-xl font-semibold">Todavía no tenés reposiciones</h2><p className="mt-1 text-muted">Cuando actives una reposición, vas a poder ver aquí su próxima fecha y volver a pedir.</p></div>;
  return <div className="mt-7 grid gap-3">{plans.map((plan) => <article key={plan.id} className="rounded-xl bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-muted">{plan.petName}</p><h2 className="mt-1 font-display text-xl font-semibold">{plan.productName ?? plan.presentation ?? "Alimento"}</h2><p className="mt-2 text-sm text-muted">Consumo estimado hasta {new Date(plan.estimatedDepletionDate).toLocaleDateString("es-AR")}</p></div><span className="rounded-full bg-soft-blue px-3 py-1 text-xs font-semibold text-brand-blue">{replenishmentStatus(plan.status)}</span></div><button type="button" onClick={() => void reorder(plan.id)} disabled={reordering === plan.id} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-blue px-4 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-60"><ArrowClockwise size={17} />{reordering === plan.id ? "Agregando…" : "Volver a pedir"}</button></article>)}</div>;
}

function Orders({ orders, detail, meta }: { orders: OrderSummary[]; detail: OrderSummary | null; meta?: AccountOrdersSection["meta"] }) {
  if (detail) return <article className="mt-7 rounded-xl bg-white p-5 sm:p-7"><Link href="/mi-cuenta/pedidos" className="text-sm font-semibold text-brand-blue">← Volver a pedidos</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-display text-2xl font-semibold">Pedido {detail.id}</h2><p className="mt-2 text-sm text-muted">{orderStatus(detail.status)} · {new Date(detail.createdAt).toLocaleDateString("es-AR")}</p></div><PaymentBadge status={detail.paymentStatus} /></div>{detail.reconciliationRequired ? <p className="mt-5 rounded-xl bg-[#fff4cf] p-4 text-sm text-[#6f4d00]">Este pago requiere revisión manual. No generamos otro intento para evitar un cobro duplicado.</p> : null}<ul className="mt-6 divide-y divide-catalog-line">{detail.lines.map((line) => <li key={line.variantId} className="flex justify-between gap-4 py-3"><span>{line.quantity} × {line.productName}{line.presentation ? ` · ${line.presentation}` : ""}</span><span className="shrink-0 tabular-nums">{formatMoney(Number(line.lineTotal))}</span></li>)}</ul><div className="mt-5 flex justify-between border-t border-catalog-line pt-5 font-semibold"><span>Total</span><span>{formatMoney(Number(detail.total))}</span></div>{detail.canRetry && !detail.reconciliationRequired ? <OrderRetryButton orderId={detail.id} /> : null}</article>;
  return <div className="mt-7 grid gap-3">{orders.length ? orders.map((item) => <Link key={item.id} href={`/mi-cuenta/pedidos/${item.id}`} className="rounded-xl bg-white p-5 transition-colors hover:bg-soft-blue"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">Pedido {item.id}</h2><p className="mt-1 text-sm text-muted">{new Date(item.createdAt).toLocaleDateString("es-AR")} · {orderStatus(item.status)}</p></div><PaymentBadge status={item.paymentStatus} /></div><div className="mt-4 flex items-end justify-between gap-3"><p className="text-sm text-muted">{item.lines.reduce((total, line) => total + line.quantity, 0)} unidades</p><strong className="tabular-nums">{formatMoney(Number(item.total))}</strong></div></Link>) : <div className="rounded-xl bg-white p-7"><Package size={32} className="text-brand-blue" /><h2 className="mt-4 font-display text-2xl font-semibold">Todavía no tenés pedidos</h2><Link href="/perros" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-brand-blue px-5 font-semibold text-white">Ver catálogo</Link></div>}{meta && meta.totalPages > 1 ? <nav aria-label="Paginación de pedidos" className="mt-4 flex items-center justify-center gap-3"><Link aria-disabled={meta.page <= 1} tabIndex={meta.page <= 1 ? -1 : undefined} href={`/mi-cuenta/pedidos?page=${Math.max(1, meta.page - 1)}`} className={`rounded-xl px-4 py-3 text-sm font-semibold ${meta.page <= 1 ? "pointer-events-none opacity-40" : "bg-white hover:text-brand-blue"}`}>Anterior</Link><span className="text-sm text-muted">{meta.page} de {meta.totalPages}</span><Link aria-disabled={meta.page >= meta.totalPages} tabIndex={meta.page >= meta.totalPages ? -1 : undefined} href={`/mi-cuenta/pedidos?page=${Math.min(meta.totalPages, meta.page + 1)}`} className={`rounded-xl px-4 py-3 text-sm font-semibold ${meta.page >= meta.totalPages ? "pointer-events-none opacity-40" : "bg-white hover:text-brand-blue"}`}>Siguiente</Link></nav> : null}</div>;
}

function OrderRetryButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function retry() {
    if (loading) return;
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/commerce/payments/orders/${encodeURIComponent(orderId)}/link`, { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() } });
      const payload = await response.json().catch(() => null) as { action?: "REDIRECT" | "NONE" | "RETRY"; paymentUrl?: string | null; message?: string } | null;
      if (!response.ok) throw new Error(payload?.message ?? "No pudimos iniciar otro intento de pago.");
      const url = payload?.action && payload.paymentUrl !== undefined ? paymentRedirectUrl({ action: payload.action, paymentUrl: payload.paymentUrl }) : null;
      if (!url) throw new Error("La plataforma de pago no devolvió una URL válida.");
      window.location.assign(url);
    } catch (cause) { setError(errorMessage(cause, "No pudimos iniciar otro intento de pago.")); setLoading(false); }
  }
  return <div className="mt-5">{error ? <p role="alert" className="mb-3 rounded-lg bg-[#fff1f1] p-3 text-sm text-[#8d2020]">{error}</p> : null}<button type="button" onClick={() => void retry()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-blue px-4 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-60"><ArrowClockwise size={17} />{loading ? "Abriendo pago…" : "Reintentar pago"}</button></div>;
}

function PaymentBadge({ status }: { status: OrderSummary["paymentStatus"] }) {
  const positive = status === "PAID";
  const pending = status === "PENDING" || status === "PROCESSING";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${positive ? "bg-[#e7f5eb] text-[#17643a]" : pending ? "bg-[#fff4cf] text-[#805600]" : "bg-catalog-canvas text-muted"}`}>{paymentStatusLabel(status)}</span>;
}

function Addresses({ addresses, onChange, setMessage }: { addresses: CustomerAddress[]; onChange: (value: CustomerAddress[]) => void; setMessage: (value: string | null) => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null);
    const data = new FormData(event.currentTarget);
    const input: CustomerAddressInput = { label: String(data.get("label")), recipientName: String(data.get("recipientName")), phone: String(data.get("phone") || "") || null, street: String(data.get("street")), number: String(data.get("number")), apartment: String(data.get("apartment") || "") || null, neighborhood: String(data.get("neighborhood") || "") || null, city: String(data.get("city")), province: String(data.get("province")), postalCode: String(data.get("postalCode")), reference: String(data.get("reference") || "") || null, isDefault: data.get("isDefault") === "on" };
    try { const saved = await requestJson<CustomerAddress>(editing ? `/me/addresses/${editing.id}` : "/me/addresses", { method: editing ? "PATCH" : "POST", body: JSON.stringify(input) }); const nextAddresses = editing ? addresses.map((item) => item.id === saved.id ? saved : item) : [saved, ...addresses]; onChange(saved.isDefault ? nextAddresses.map((item) => item.id === saved.id ? item : { ...item, isDefault: false }) : nextAddresses); setEditing(null); setFormOpen(false); setMessage("Dirección guardada."); notifySessionChanged(); (event.target as HTMLFormElement).reset(); if (saved.isDefault || editing?.isDefault) router.refresh(); } catch (cause) { setMessage(errorMessage(cause, "No pudimos guardar la dirección.")); } finally { setSaving(false); }
  }
  async function remove(id: string) {
    if (!window.confirm("¿Querés eliminar esta dirección?")) return;
    try { const removedWasDefault = addresses.find((item) => item.id === id)?.isDefault; await requestJson(`/me/addresses/${id}`, { method: "DELETE" }); onChange(addresses.filter((item) => item.id !== id)); setMessage("Dirección eliminada."); notifySessionChanged(); if (removedWasDefault) router.refresh(); }
    catch (cause) { setMessage(errorMessage(cause, "No pudimos eliminar la dirección.")); }
  }
  return <div className="mt-7 space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-xl font-semibold">Direcciones guardadas</h2><p className="mt-1 text-sm text-muted">Usalas para completar más rápido tus compras.</p></div><button type="button" onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-blue px-4 font-semibold text-white">Agregar dirección</button></div><div className="grid gap-3 md:grid-cols-2">{addresses.map((address) => <article key={address.id} className="rounded-xl bg-white p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-xl font-semibold">{address.label}{address.isDefault ? " · Principal" : ""}</h3><p className="mt-2 text-muted">{address.street} {address.number}{address.apartment ? `, ${address.apartment}` : ""}</p><p className="text-sm text-muted">{address.neighborhood ? `${address.neighborhood}, ` : ""}{address.city}, {address.province} · {address.postalCode}</p></div><MapPin size={22} className="shrink-0 text-brand-blue" /></div><div className="mt-4 flex gap-4 text-sm font-semibold"><button type="button" onClick={() => { setEditing(address); setFormOpen(true); }} className="inline-flex items-center gap-1 text-brand-blue"><PencilSimple size={16} /> Editar</button><button type="button" onClick={() => void remove(address.id)} className="inline-flex items-center gap-1 text-muted hover:text-[#8d2020]"><Trash size={16} /> Eliminar</button></div></article>)}{!addresses.length ? <div className="rounded-xl bg-white p-7 text-muted md:col-span-2">Todavía no guardaste direcciones.</div> : null}</div>{formOpen ? <form key={editing?.id ?? "new-address"} onSubmit={save} className="rounded-xl bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">{editing ? "Editar dirección" : "Nueva dirección"}</h2><p className="mt-1 text-sm text-muted">Completá los datos para usarla en tus pedidos.</p></div><button type="button" onClick={() => { setEditing(null); setFormOpen(false); }} className="text-sm font-semibold text-muted hover:text-ink">Cerrar</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><AddressField name="label" label="Etiqueta" defaultValue={editing?.label} placeholder="Casa" /><AddressField name="recipientName" label="Quién recibe" defaultValue={editing?.recipientName} /><AddressField name="phone" label="Teléfono" defaultValue={editing?.phone ?? ""} required={false} /><AddressField name="street" label="Calle" defaultValue={editing?.street} /><AddressField name="number" label="Número" defaultValue={editing?.number} /><AddressField name="apartment" label="Piso / departamento" defaultValue={editing?.apartment ?? ""} required={false} /><AddressField name="neighborhood" label="Barrio / localidad" defaultValue={editing?.neighborhood ?? ""} required={false} /><AddressField name="city" label="Ciudad" defaultValue={editing?.city ?? "Buenos Aires"} /><AddressField name="province" label="Provincia" defaultValue={editing?.province ?? "Buenos Aires"} /><AddressField name="postalCode" label="Código postal" defaultValue={editing?.postalCode} /><AddressField name="reference" label="Referencia" defaultValue={editing?.reference ?? ""} required={false} /></div><label className="mt-4 flex items-center gap-2 text-sm font-semibold"><input name="isDefault" type="checkbox" defaultChecked={editing?.isDefault} className="size-4 accent-brand-blue" /> Usar como principal</label><div className="mt-5 flex gap-2"><button type="submit" disabled={saving} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 font-semibold text-white disabled:opacity-60">{saving ? "Guardando…" : "Guardar"}<CheckCircle size={17} /></button><button type="button" onClick={() => { setEditing(null); setFormOpen(false); }} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-catalog-canvas px-4 font-semibold">Cancelar</button></div></form> : null}</div>;
}

function AddressField({ name, label, required = true, ...props }: { name: string; label: string; required?: boolean } & InputHTMLAttributes<HTMLInputElement>) { return <label className="text-sm font-semibold">{label}<input name={name} required={required} {...props} className="mt-1 h-11 w-full rounded-xl border border-catalog-line px-3 font-normal focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue" /></label>; }
function SelectField({ name, label, defaultValue, options }: { name: string; label: string; defaultValue: string; options: Array<[string, string]> }) { return <label className="text-sm font-semibold">{label}<select name={name} defaultValue={defaultValue} className="mt-1 h-11 w-full rounded-xl border border-catalog-line bg-white px-3 font-normal focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>; }
function AccountLoadError({ message }: { message: string }) { return <section className="max-w-xl rounded-xl bg-white p-6"><h1 className="font-display text-2xl font-semibold">No pudimos cargar tu cuenta</h1><p role="alert" className="mt-3 text-muted">{message}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-11 rounded-xl bg-brand-blue px-4 font-semibold text-white">Intentar nuevamente</button></section>; }
function lifeStageLabel(stage: CustomerPet["lifeStage"]) { return ({ puppy: "Cachorro", adult: "Adulto", senior: "Senior" } as const)[stage]; }
function replenishmentStatus(status: string) { return ({ ACTIVE: "Activa", PAUSED: "Pausada", CANCELLED: "Cancelada", NEEDS_REVIEW: "Revisar" } as Record<string, string>)[status] ?? status; }
function orderStatus(status: string) { return ({ DRAFT: "Borrador", PENDING_PAYMENT: "Pendiente de pago", PAID: "Pagado", PROCESSING: "En preparación", SHIPPED: "Enviado", DELIVERED: "Entregado", CANCELLED: "Cancelado" } as Record<string, string>)[status] ?? status; }
async function requestJson<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`/api/commerce${path}`, { ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } }); const payload = await response.json().catch(() => null) as T | { message?: string } | null; if (!response.ok) throw Object.assign(new Error(payload && typeof payload === "object" && "message" in payload ? payload.message : "La API no pudo completar la operación."), { status: response.status }); return payload as T; }
async function requestAuthJson<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`/api/auth${path}`, { ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } }); const payload = await response.json().catch(() => null) as T | { message?: string } | null; if (!response.ok) throw Object.assign(new Error(payload && typeof payload === "object" && "message" in payload ? payload.message : "La API no pudo completar la autenticación."), { status: response.status }); return payload as T; }
function errorMessage(cause: unknown, fallback: string) { return cause instanceof Error ? cause.message : fallback; }
