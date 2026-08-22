"use client";

import { ArrowRight, CheckCircle, MapPin, Package, PencilSimple, SignOut, Trash, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { type FormEvent, type InputHTMLAttributes, useCallback, useEffect, useState } from "react";

import type { AuthUser } from "@/domain/auth/types";
import type { CustomerAddress, CustomerAddressInput, CustomerProfile, OrderSummary } from "@/domain/customer/types";
import { formatMoney } from "@/lib/catalog-formatters";

type AccountSection = "resumen" | "pedidos" | "direcciones" | "mascotas" | "reposiciones";

const navigation: Array<{ label: string; href: string; section: AccountSection }> = [
  { label: "Resumen", href: "/mi-cuenta", section: "resumen" },
  { label: "Pedidos", href: "/mi-cuenta/pedidos", section: "pedidos" },
  { label: "Direcciones", href: "/mi-cuenta/direcciones", section: "direcciones" },
  { label: "Mascotas", href: "/mi-cuenta/mascotas", section: "mascotas" },
  { label: "Reposiciones", href: "/mi-cuenta/reposiciones", section: "reposiciones" },
];

export function AccountPage({ section, orderId }: { section: AccountSection; orderId?: string }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const authResponse = await fetch("/api/auth/me");
      const auth = await authResponse.json().catch(() => null) as AuthUser | { message?: string } | null;
      if (!authResponse.ok || !auth || !("id" in auth)) throw Object.assign(new Error(auth && "message" in auth ? auth.message : "Necesitás iniciar sesión."), { status: authResponse.status });
      setUser(auth);
      const profileResult = await requestJson<CustomerProfile>("/me/customer");
      setProfile(profileResult);
      if (section === "direcciones") setAddresses(await requestJson<CustomerAddress[]>("/me/addresses"));
      if (section === "pedidos" || section === "resumen") {
        const result = await requestJson<OrderSummary[]>("/me/orders");
        setOrders(result);
        if (orderId) setOrder(await requestJson<OrderSummary>(`/me/orders/${encodeURIComponent(orderId)}`));
      }
    } catch (cause) {
      if (isUnauthorized(cause)) setUser(null);
      else setError(errorMessage(cause, "No pudimos cargar tu cuenta."));
    } finally {
      setLoading(false);
    }
  }, [orderId, section]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadAccount(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAccount]);

  if (loading) return <div className="rounded-xl bg-white p-8 text-center text-muted">Cargando tu cuenta…</div>;
  if (!user) return <AuthPanel onAuthenticated={(nextUser) => { setUser(nextUser); window.dispatchEvent(new Event("patitas-auth-changed")); void loadAccount(); }} />;

  const title = section === "pedidos" ? "Mis pedidos" : section === "direcciones" ? "Mis direcciones" : section === "mascotas" ? "Mis mascotas" : section === "reposiciones" ? "Próximas reposiciones" : "Mi cuenta";
  return <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
    <aside className="h-fit rounded-xl bg-white p-3" aria-label="Mi cuenta">
      <div className="flex items-center gap-3 border-b border-catalog-line px-3 pb-4 pt-2"><span className="flex size-10 items-center justify-center rounded-lg bg-brand-yellow text-ink"><UserCircle size={23} weight="bold" /></span><span className="min-w-0"><strong className="block truncate text-sm">{profile?.fullName || user.email}</strong><span className="block truncate text-xs text-muted">{user.email}</span></span></div>
      <nav className="mt-2 grid gap-1">{navigation.map((item) => <Link key={item.href} href={item.href} className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold ${section === item.section ? "bg-brand-yellow text-ink" : "text-muted hover:bg-catalog-canvas hover:text-ink"}`}>{item.label}</Link>)}</nav>
      <button type="button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); setProfile(null); window.dispatchEvent(new Event("patitas-auth-changed")); }} className="mt-3 flex min-h-11 w-full items-center gap-2 rounded-lg border-t border-catalog-line px-3 pt-3 text-left text-sm font-semibold text-muted hover:text-ink"><SignOut size={18} /> Cerrar sesión</button>
    </aside>
    <section className="min-w-0"><h1 className="display-heading text-4xl sm:text-6xl">{title}</h1>{error ? <p role="alert" className="mt-5 rounded-xl bg-[#fff1f1] p-4 text-sm text-[#8d2020]">{error}</p> : null}{message ? <p role="status" className="mt-5 rounded-xl bg-soft-blue p-4 text-sm text-ink">{message}</p> : null}{section === "resumen" ? <Summary profile={profile} orders={orders} /> : null}{section === "pedidos" ? <Orders orders={orders} detail={order} /> : null}{section === "direcciones" ? <Addresses addresses={addresses} onChange={setAddresses} setMessage={setMessage} /> : null}{section === "mascotas" || section === "reposiciones" ? <ComingSoon section={section} /> : null}</section>
  </div>;
}

function AuthPanel({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null); setMessage(null);
    try {
      const result = await requestAuthJson<{ status: "authenticated" | "verification_required"; user: AuthUser | null }>(`/${mode}`, { method: "POST", body: JSON.stringify({ email, password }) });
      if (result.status === "verification_required") { setMessage("Revisá tu correo para verificar la cuenta y después iniciá sesión."); return; }
      if (!result.user) throw new Error("La API no devolvió el usuario de la sesión.");
      onAuthenticated(result.user);
    } catch (cause) { setError(errorMessage(cause, "No pudimos completar la autenticación.")); }
    finally { setLoading(false); }
  }

  return <section className="max-w-xl rounded-xl bg-white p-5 sm:p-8"><div className="flex gap-2 border-b border-catalog-line pb-2"><button type="button" onClick={() => setMode("login")} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${mode === "login" ? "bg-brand-yellow text-ink" : "text-muted"}`}>Iniciar sesión</button><button type="button" onClick={() => setMode("register")} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${mode === "register" ? "bg-brand-yellow text-ink" : "text-muted"}`}>Crear cuenta</button></div><h2 className="mt-6 font-display text-2xl font-semibold">{mode === "login" ? "Volvé a tu cuenta" : "Creá tu cuenta Patitas"}</h2><p className="mt-2 text-muted">{mode === "login" ? "Consultá tus pedidos y direcciones guardadas." : "Guardá tus datos y asociá tu carrito después de iniciar sesión."}</p><form onSubmit={submit} className="mt-6 grid gap-4"><label className="font-semibold">Correo electrónico<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-catalog-line px-4 font-normal outline-none focus:border-brand-blue" /></label><label className="font-semibold">Contraseña<input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-catalog-line px-4 font-normal outline-none focus:border-brand-blue" /></label>{error ? <p role="alert" className="rounded-lg bg-[#fff1f1] p-3 text-sm text-[#8d2020]">{error}</p> : null}{message ? <p role="status" className="rounded-lg bg-soft-blue p-3 text-sm text-ink">{message}</p> : null}<button type="submit" disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white disabled:opacity-60">{loading ? "Guardando…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}<ArrowRight size={18} weight="bold" /></button></form></section>;
}

function Summary({ profile, orders }: { profile: CustomerProfile | null; orders: OrderSummary[] }) {
  return <div className="mt-7 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-white p-5"><p className="text-sm text-muted">Datos personales</p><h2 className="mt-2 font-display text-2xl font-semibold">{profile?.fullName || "Completá tu nombre"}</h2><p className="mt-1 text-muted">{profile?.email}</p><p className="mt-1 text-muted">{profile?.phone || "Sin teléfono cargado"}</p><Link href="/mi-cuenta/direcciones" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue">Gestionar direcciones <ArrowRight size={16} /></Link></div><div className="rounded-xl bg-soft-blue p-5"><p className="text-sm text-muted">Actividad</p><p className="mt-2 font-display text-4xl font-semibold">{orders.length}</p><p className="text-muted">pedidos registrados</p><Link href="/mi-cuenta/pedidos" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue">Ver pedidos <ArrowRight size={16} /></Link></div></div>;
}

function Orders({ orders, detail }: { orders: OrderSummary[]; detail: OrderSummary | null }) {
  if (detail) return <article className="mt-7 rounded-xl bg-white p-5 sm:p-7"><Link href="/mi-cuenta/pedidos" className="text-sm font-semibold text-brand-blue">← Volver a pedidos</Link><h2 className="mt-5 font-display text-2xl font-semibold">Pedido {detail.id}</h2><p className="mt-2 text-muted">{orderStatus(detail.status)} · {new Date(detail.createdAt).toLocaleDateString("es-AR")}</p><ul className="mt-6 divide-y divide-catalog-line">{detail.lines.map((line) => <li key={line.variantId} className="flex justify-between gap-4 py-3"><span>{line.quantity} × {line.productName}</span><span className="shrink-0 tabular-nums">{formatMoney(Number(line.lineTotal))}</span></li>)}</ul><div className="mt-5 flex justify-between border-t border-catalog-line pt-5 font-semibold"><span>Total</span><span>{formatMoney(Number(detail.total))}</span></div></article>;
  return <div className="mt-7 grid gap-3">{orders.length ? orders.map((item) => <Link key={item.id} href={`/mi-cuenta/pedidos/${item.id}`} className="rounded-xl bg-white p-5 hover:bg-soft-blue"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">Pedido {item.id}</h2><p className="mt-1 text-sm text-muted">{new Date(item.createdAt).toLocaleDateString("es-AR")} · {orderStatus(item.status)}</p></div><strong className="tabular-nums">{formatMoney(Number(item.total))}</strong></div><p className="mt-4 text-sm text-muted">{item.lines.reduce((total, line) => total + line.quantity, 0)} unidades</p></Link>) : <div className="rounded-xl bg-white p-7"><Package size={32} className="text-brand-blue" /><h2 className="mt-4 font-display text-2xl font-semibold">Todavía no tenés pedidos</h2><Link href="/perros" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-brand-blue px-5 font-semibold text-white">Ver catálogo</Link></div>}</div>;
}

function Addresses({ addresses, onChange, setMessage }: { addresses: CustomerAddress[]; onChange: (value: CustomerAddress[]) => void; setMessage: (value: string | null) => void }) {
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [saving, setSaving] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null);
    const data = new FormData(event.currentTarget);
    const input: CustomerAddressInput = { label: String(data.get("label")), recipientName: String(data.get("recipientName")), phone: String(data.get("phone") || "") || null, street: String(data.get("street")), number: String(data.get("number")), apartment: String(data.get("apartment") || "") || null, city: String(data.get("city")), province: String(data.get("province")), postalCode: String(data.get("postalCode")), reference: String(data.get("reference") || "") || null, isDefault: data.get("isDefault") === "on" };
    try { const saved = await requestJson<CustomerAddress>(editing ? `/me/addresses/${editing.id}` : "/me/addresses", { method: editing ? "PATCH" : "POST", body: JSON.stringify(input) }); onChange(editing ? addresses.map((item) => item.id === saved.id ? saved : item) : [saved, ...addresses]); setEditing(null); setMessage("Dirección guardada."); (event.target as HTMLFormElement).reset(); } catch (cause) { setMessage(errorMessage(cause, "No pudimos guardar la dirección.")); } finally { setSaving(false); }
  }
  async function remove(id: string) { if (!window.confirm("¿Querés eliminar esta dirección?")) return; await requestJson(`/me/addresses/${id}`, { method: "DELETE" }); onChange(addresses.filter((item) => item.id !== id)); }
  return <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="grid gap-3">{addresses.map((address) => <article key={address.id} className="rounded-xl bg-white p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">{address.label}{address.isDefault ? " · Principal" : ""}</h2><p className="mt-2 text-muted">{address.street} {address.number}{address.apartment ? `, ${address.apartment}` : ""}</p><p className="text-sm text-muted">{address.city}, {address.province} · {address.postalCode}</p></div><MapPin size={22} className="shrink-0 text-brand-blue" /></div><div className="mt-4 flex gap-4 text-sm font-semibold"><button type="button" onClick={() => setEditing(address)} className="inline-flex items-center gap-1 text-brand-blue"><PencilSimple size={16} /> Editar</button><button type="button" onClick={() => void remove(address.id)} className="inline-flex items-center gap-1 text-muted hover:text-[#8d2020]"><Trash size={16} /> Eliminar</button></div></article>)}{!addresses.length ? <div className="rounded-xl bg-white p-7 text-muted">Todavía no guardaste direcciones.</div> : null}</div><form onSubmit={save} className="h-fit rounded-xl bg-white p-5"><h2 className="font-display text-xl font-semibold">{editing ? "Editar dirección" : "Nueva dirección"}</h2><div className="mt-4 grid gap-3"><AddressField name="label" label="Etiqueta" defaultValue={editing?.label} placeholder="Casa" /><AddressField name="recipientName" label="Quién recibe" defaultValue={editing?.recipientName} /><AddressField name="phone" label="Teléfono" defaultValue={editing?.phone ?? ""} /><AddressField name="street" label="Calle" defaultValue={editing?.street} /><AddressField name="number" label="Número" defaultValue={editing?.number} /><AddressField name="apartment" label="Piso / departamento" defaultValue={editing?.apartment ?? ""} required={false} /><AddressField name="city" label="Ciudad" defaultValue={editing?.city ?? "Buenos Aires"} /><AddressField name="province" label="Provincia" defaultValue={editing?.province ?? "Buenos Aires"} /><AddressField name="postalCode" label="Código postal" defaultValue={editing?.postalCode} /><AddressField name="reference" label="Referencia" defaultValue={editing?.reference ?? ""} required={false} /><label className="flex items-center gap-2 text-sm font-semibold"><input name="isDefault" type="checkbox" defaultChecked={editing?.isDefault} className="size-4 accent-brand-blue" /> Usar como principal</label></div><div className="mt-5 flex gap-2"><button type="submit" disabled={saving} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 font-semibold text-white disabled:opacity-60">{saving ? "Guardando…" : "Guardar"}<CheckCircle size={17} /></button>{editing ? <button type="button" onClick={() => setEditing(null)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-catalog-canvas px-4 font-semibold">Cancelar</button> : null}</div></form></div>;
}

function AddressField({ name, label, required = true, ...props }: { name: string; label: string; required?: boolean } & InputHTMLAttributes<HTMLInputElement>) { return <label className="text-sm font-semibold">{label}<input name={name} required={required} {...props} className="mt-1 h-11 w-full rounded-xl border border-catalog-line px-3 font-normal outline-none focus:border-brand-blue" /></label>; }
function ComingSoon({ section }: { section: "mascotas" | "reposiciones" }) { return <div className="mt-7 rounded-xl bg-soft-blue p-7"><h2 className="font-display text-2xl font-semibold">{section === "mascotas" ? "Tus mascotas" : "Tus reposiciones"}</h2><p className="mt-2 text-muted">Esta sección todavía no tiene endpoints en el contrato de Patitas API.</p></div>; }
function orderStatus(status: string) { return ({ DRAFT: "Borrador", PENDING_PAYMENT: "Pendiente de pago", PAID: "Pagado", PROCESSING: "En preparación", SHIPPED: "Enviado", DELIVERED: "Entregado", CANCELLED: "Cancelado" } as Record<string, string>)[status] ?? status; }
async function requestJson<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`/api/commerce${path}`, { ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } }); const payload = await response.json().catch(() => null) as T | { message?: string } | null; if (!response.ok) throw Object.assign(new Error(payload && typeof payload === "object" && "message" in payload ? payload.message : "La API no pudo completar la operación."), { status: response.status }); return payload as T; }
async function requestAuthJson<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`/api/auth${path}`, { ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } }); const payload = await response.json().catch(() => null) as T | { message?: string } | null; if (!response.ok) throw Object.assign(new Error(payload && typeof payload === "object" && "message" in payload ? payload.message : "La API no pudo completar la autenticación."), { status: response.status }); return payload as T; }
function isUnauthorized(cause: unknown) { return Boolean(cause && typeof cause === "object" && "status" in cause && cause.status === 401); }
function errorMessage(cause: unknown, fallback: string) { return cause instanceof Error ? cause.message : fallback; }
