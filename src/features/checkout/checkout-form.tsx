"use client";

import { ArrowLeft, ArrowRight, CheckCircle, ClipboardText, CreditCard, MapPin, Truck, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { type FormEvent, type InputHTMLAttributes, useRef, useState } from "react";

import type { CheckoutConfirmResult, CheckoutSession, ShippingOption } from "@/domain/checkout/types";
import type { OrderSummary } from "@/domain/customer/types";
import { formatMoney } from "@/lib/catalog-formatters";
import { useCart } from "@/features/cart/cart-context";

type CheckoutStep = 1 | 2 | 3;
type PaymentMethod = "SIMULATED_CARD" | "SIMULATED_TRANSFER" | "SIMULATED_CASH";
type SubmittedOrder = { order: OrderSummary; guest: boolean };

const steps = [
  { id: 1 as const, label: "Tus datos", Icon: UserCircle },
  { id: 2 as const, label: "Dirección", Icon: MapPin },
  { id: 3 as const, label: "Envío y pago", Icon: CreditCard },
];

export function CheckoutForm({ initialSession, initialShippingOptions = [] }: { initialSession: CheckoutSession | null; initialShippingOptions?: ShippingOption[] }) {
  const { cart, items, refresh } = useCart();
  const formRef = useRef<HTMLFormElement>(null);
  const [session, setSession] = useState<CheckoutSession | null>(initialSession);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(initialShippingOptions);
  const [selectedShippingOption, setSelectedShippingOption] = useState(initialSession?.shippingOptionId ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialSession?.paymentMethod ?? "SIMULATED_CARD");
  const [couponCode, setCouponCode] = useState(initialSession?.couponCode ?? "");
  const [couponLoading, setCouponLoading] = useState(false);
  const [step, setStep] = useState<CheckoutStep>(initialSession ? stepFromStage(initialSession.stage) : 1);
  const [submitted, setSubmitted] = useState<SubmittedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recoverConflict() {
    await refresh();
    const currentSession = session;
    if (!currentSession) return;
    try {
      const latest = await requestJson<CheckoutSession>(`/checkout/sessions/${currentSession.id}`);
      setSession(latest);
      if (latest.shippingOptionId) setSelectedShippingOption(latest.shippingOptionId);
    } catch {
      // El error original del paso conserva el mensaje que verá la persona.
    }
  }

  async function applyCoupon() {
    if (!session || !couponCode.trim()) return;
    setCouponLoading(true);
    setError(null);
    try {
      const next = await requestJson<CheckoutSession>(`/checkout/sessions/${session.id}/coupon`, { method: "POST", body: JSON.stringify({ code: couponCode.trim() }) });
      setSession(next);
      setCouponCode(next.couponCode ?? couponCode.trim().toUpperCase());
    } catch (cause) {
      if (isConflict(cause)) await recoverConflict();
      setError(errorMessage(cause, "No pudimos aplicar el cupón."));
    } finally {
      setCouponLoading(false);
    }
  }

  async function clearCoupon() {
    if (!session) return;
    setCouponLoading(true);
    setError(null);
    try {
      const next = await requestJson<CheckoutSession>(`/checkout/sessions/${session.id}/coupon`, { method: "DELETE" });
      setSession(next);
      setCouponCode("");
    } catch (cause) {
      if (isConflict(cause)) await recoverConflict();
      setError(errorMessage(cause, "No pudimos quitar el cupón."));
    } finally {
      setCouponLoading(false);
    }
  }

  async function selectPaymentMethod(nextMethod: PaymentMethod) {
    setPaymentMethod(nextMethod);
    if (!session || session.paymentMethod === nextMethod || loading) return;
    setLoading(true);
    setError(null);
    try {
      const next = await requestJson<CheckoutSession>(`/checkout/sessions/${session.id}/payment-method`, { method: "PATCH", body: JSON.stringify({ paymentMethod: nextMethod }) });
      setSession(next);
    } catch (cause) {
      if (isConflict(cause)) await recoverConflict();
      setPaymentMethod(session.paymentMethod ?? "SIMULATED_CARD");
      setError(errorMessage(cause, "No pudimos guardar el método de pago."));
    } finally {
      setLoading(false);
    }
  }

  function validateStep(targetStep: CheckoutStep) {
    if (!formRef.current) return false;
    const fields = Array.from(formRef.current.elements).filter((element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
      "dataset" in element && element.dataset.step === String(targetStep),
    );
    const invalid = fields.find((field) => !field.checkValidity());
    if (invalid) { invalid.reportValidity(); return false; }
    return true;
  }

  async function goNext() {
    if (!validateStep(step) || !session) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData(formRef.current!);
      if (step === 1) {
        const fullName = `${form.get("firstName") ?? ""} ${form.get("lastName") ?? ""}`.trim();
        const next = await requestJson<CheckoutSession>(`/checkout/sessions/${session.id}/contact`, { method: "PATCH", body: JSON.stringify({ contactName: fullName, contactEmail: form.get("email"), contactPhone: form.get("phone") || null }) });
        setSession(next);
      }
      if (step === 2) {
        const next = await requestJson<CheckoutSession>(`/checkout/sessions/${session.id}/shipping-address`, { method: "PATCH", body: JSON.stringify({ address: { recipientName: `${form.get("firstName") ?? ""} ${form.get("lastName") ?? ""}`.trim(), street: form.get("street"), number: form.get("number"), apartment: form.get("apartment") || "", neighborhood: form.get("neighborhood") || "", city: form.get("city"), province: form.get("province"), postalCode: form.get("postalCode"), reference: form.get("reference") || "" } }) });
        setSession(next);
        const options = await requestJson<ShippingOption[]>(`/checkout/sessions/${session.id}/shipping-options`);
        if (!options.length) throw new Error("No hay métodos de envío disponibles para este pedido.");
        setShippingOptions(options);
        setSelectedShippingOption(next.shippingOptionId ?? options[0]?.id ?? "");
      }
      setStep((current) => Math.min(3, current + 1) as CheckoutStep);
    } catch (cause) {
      if (isConflict(cause)) await recoverConflict();
      setError(errorMessage(cause, "No pudimos guardar este paso."));
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      setError("Estamos recuperando la sesión del checkout. Esperá un momento e intentá nuevamente.");
      return;
    }
    const form = new FormData(formRef.current!);
    const shippingOptionId = selectedShippingOption || String(form.get("shippingOption") ?? "");
    if (!shippingOptionId) {
      setError(shippingOptions.length ? "Elegí un método de envío para continuar." : "No hay métodos de envío disponibles para este pedido.");
      return;
    }
    if (!validateStep(3)) {
      setError("Aceptá los términos y condiciones para continuar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let current = session;
      if (current.shippingOptionId !== shippingOptionId) {
        current = await requestJson<CheckoutSession>(`/checkout/sessions/${session.id}/shipping-option`, { method: "PATCH", body: JSON.stringify({ shippingOptionId }) });
      }
      if (current.paymentMethod !== paymentMethod) {
        current = await requestJson<CheckoutSession>(`/checkout/sessions/${session.id}/payment-method`, { method: "PATCH", body: JSON.stringify({ paymentMethod }) });
      }
      const result = await requestJson<CheckoutConfirmResult>(`/checkout/sessions/${session.id}/confirm`, { method: "POST" });
      setSubmitted({ order: result.order, guest: Boolean(result.publicToken) });
      setSession(null);
      await refresh();
    } catch (cause) {
      if (isConflict(cause)) await recoverConflict();
      setError(errorMessage(cause, "No pudimos confirmar el pedido. Revisá stock, envío y datos."));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) return <Confirmation {...submitted} />;
  if (!items.length) return <EmptyCheckout />;

  const contact = splitContactName(session?.contactName);
  const address = session?.shippingAddress;

  return (
    <form key={session?.id ?? "checkout"} ref={formRef} onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
      <div>
        <ol className="mb-7 grid grid-cols-3 gap-2" aria-label="Progreso del checkout">
          {steps.map(({ id, label, Icon }) => <li key={id} aria-current={step === id ? "step" : undefined} className={`relative flex min-w-0 items-center gap-2 border-b-2 pb-3 text-sm ${step >= id ? "border-brand-blue font-semibold text-ink" : "border-catalog-line text-muted"}`}><span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${step >= id ? "bg-brand-yellow text-ink" : "bg-catalog-soft text-muted"}`}>{step > id ? <CheckCircle size={17} weight="bold" aria-hidden="true" /> : <Icon size={17} weight={step === id ? "bold" : "regular"} aria-hidden="true" />}</span><span className="hidden sm:inline">{label}</span></li>)}
        </ol>

        <fieldset hidden={step !== 1} className="rounded-xl bg-white p-4 sm:p-7">
          <legend className="px-1 font-display text-xl font-semibold sm:text-2xl">Tus datos</legend>
          <p className="mb-6 mt-2 text-sm text-muted">Necesitamos estos datos para identificar el pedido y contactarte.</p>
          <div className="grid gap-4 sm:grid-cols-2"><Field name="firstName" label="Nombre" formStep={1} defaultValue={contact.firstName} autoComplete="given-name" /><Field name="lastName" label="Apellido" formStep={1} defaultValue={contact.lastName} autoComplete="family-name" /><Field name="phone" label="Teléfono" formStep={1} defaultValue={session?.contactPhone ?? ""} type="tel" inputMode="tel" autoComplete="tel" placeholder="11 1234-5678" /><Field name="email" label="Correo electrónico" formStep={1} defaultValue={session?.contactEmail ?? ""} type="email" autoComplete="email" placeholder="vos@ejemplo.com" className="sm:col-span-2" /></div>
        </fieldset>

        <fieldset hidden={step !== 2} className="rounded-xl bg-white p-4 sm:p-7">
          <legend className="px-1 font-display text-xl font-semibold sm:text-2xl">Dirección de entrega</legend>
          <p className="mb-6 mt-2 text-sm text-muted">Usamos el formato argentino de calle, número, departamento y localidad.</p>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]"><Field name="street" label="Calle" formStep={2} defaultValue={address?.street ?? ""} autoComplete="street-address" placeholder="Ej. Avenida Corrientes" /><Field name="number" label="Número" formStep={2} defaultValue={address?.number ?? ""} inputMode="numeric" autoComplete="address-line1" placeholder="1234" /><Field name="apartment" label="Piso / departamento" formStep={2} defaultValue={address?.apartment ?? ""} required={false} autoComplete="address-line2" placeholder="Opcional" /><Field name="postalCode" label="Código postal" formStep={2} defaultValue={address?.postalCode ?? ""} autoComplete="postal-code" placeholder="C1000AAA o 1000" pattern="[A-Za-z]?[0-9]{4}([A-Za-z]{3})?" onInput={(event) => { event.currentTarget.value = event.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); }} /><Field name="neighborhood" label="Barrio / localidad" formStep={2} defaultValue={address?.neighborhood ?? ""} autoComplete="address-level2" required={false} className="sm:col-span-2" placeholder="Ej. Palermo" /><Field name="city" label="Ciudad" formStep={2} defaultValue={address?.city ?? "Buenos Aires"} autoComplete="address-level2" /><Field name="province" label="Provincia" formStep={2} defaultValue={address?.province ?? "Buenos Aires"} autoComplete="address-level1" /><Field name="reference" label="Indicaciones" formStep={2} defaultValue={address?.reference ?? ""} required={false} className="sm:col-span-2" placeholder="Timbre, acceso, referencia…" /></div>
        </fieldset>

        <fieldset hidden={step !== 3} className="rounded-xl bg-white p-4 sm:p-7">
          <legend className="px-1 font-display text-xl font-semibold sm:text-2xl">Envío y pago</legend>
          <p className="mt-2 text-sm text-muted">Elegí la entrega y un método de pago simulado. No pedimos ni guardamos datos reales de tarjeta.</p>{session?.stage === "CONFIRMATION" ? <p className="mt-3 rounded-lg bg-soft-blue p-3 text-sm font-semibold text-ink">Tu checkout está listo. Revisá los datos y confirmá el pedido.</p> : null}
          <div className="mt-6 grid gap-2">{shippingOptions.map((option) => <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${selectedShippingOption === option.id ? "border-brand-blue bg-soft-blue" : "border-border bg-white"}`}><input type="radio" name="shippingOption" value={option.id} checked={selectedShippingOption === option.id} onChange={() => setSelectedShippingOption(option.id)} className="mt-1 accent-brand-blue" /><span className="min-w-0 flex-1"><span className="block font-semibold">{option.name}</span>{option.description ? <span className="mt-1 block text-sm text-muted">{option.description}</span> : null}</span><strong className="shrink-0 text-sm tabular-nums">{formatMoney(Number(option.cost))}</strong></label>)}</div>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">{(["SIMULATED_CARD", "SIMULATED_TRANSFER", "SIMULATED_CASH"] as const).map((method) => <label key={method} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${paymentMethod === method ? "border-brand-yellow bg-brand-yellow text-ink" : "border-border bg-white"} ${loading ? "cursor-wait opacity-70" : ""}`}><input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} onChange={() => void selectPaymentMethod(method)} disabled={loading} className="sr-only" />{method === "SIMULATED_CARD" ? "Tarjeta simulada" : method === "SIMULATED_TRANSFER" ? "Transferencia" : "Efectivo"}</label>)}</div>
          <div className="mt-6 rounded-xl bg-catalog-canvas p-4"><p className="text-sm font-semibold">¿Tenés un cupón?</p><div className="mt-3 flex gap-2"><input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} aria-label="Código de cupón" placeholder="Código" className="h-11 min-w-0 flex-1 rounded-lg border border-catalog-line bg-white px-3 uppercase outline-none focus:border-brand-blue" disabled={Boolean(session?.couponCode) || couponLoading} /><button type="button" onClick={() => void applyCoupon()} disabled={!couponCode.trim() || Boolean(session?.couponCode) || couponLoading} className="min-h-11 rounded-lg bg-brand-yellow px-4 text-sm font-semibold text-ink disabled:opacity-50">Aplicar</button></div>{session?.couponCode ? <p className="mt-2 flex items-center justify-between gap-3 text-sm text-muted"><span>Cupón aplicado: <strong className="text-ink">{session.couponCode}</strong></span><button type="button" onClick={() => void clearCoupon()} disabled={couponLoading} className="font-semibold text-brand-blue hover:underline">Quitar</button></p> : null}</div>
          <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-muted"><input name="terms" type="checkbox" required data-step="3" className="mt-1 size-4 accent-brand-blue" /><span>Leí y acepto los <Link href="/terminos" className="font-semibold text-brand-blue underline">términos y condiciones</Link> y la <Link href="/privacidad" className="font-semibold text-brand-blue underline">política de privacidad</Link>.</span></label>
        </fieldset>

        {error ? <p role="alert" className="mt-5 rounded-xl bg-[#fff1f1] p-4 text-sm text-[#8d2020]">{error}</p> : null}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:justify-between">{step > 1 ? <button type="button" onClick={() => { setStep((current) => Math.max(1, current - 1) as CheckoutStep); setError(null); }} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-catalog-canvas px-4 font-semibold text-ink sm:w-auto sm:px-5"><ArrowLeft size={17} /> Volver</button> : <span />}{step < 3 ? <button type="button" onClick={() => void goNext()} disabled={loading || !session} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 font-semibold text-white hover:bg-[#0048dc] disabled:opacity-60 sm:w-auto sm:px-5">{loading ? "Guardando…" : "Continuar"}<ArrowRight size={17} weight="bold" /></button> : <button type="submit" disabled={loading || !session} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 font-semibold text-white hover:bg-[#0048dc] disabled:opacity-60 sm:w-auto sm:px-5">{loading ? "Confirmando…" : "Confirmar pedido"}<ClipboardText size={18} weight="bold" /></button>}</div>
      </div>

      <aside className="h-fit rounded-xl bg-white p-5 sm:p-6" aria-labelledby="checkout-summary-title"><h2 id="checkout-summary-title" className="font-display text-2xl font-semibold">Tu pedido</h2><ul className="mt-5 space-y-3 text-sm">{(session?.items ?? items).map((item) => <li key={item.variantId} className="flex justify-between gap-3"><span className="min-w-0"><span className="block truncate">{item.quantity} × {item.productName}</span><span className="block text-xs text-muted">{item.presentation ?? "Presentación"}</span></span><span className="shrink-0 tabular-nums">{formatMoney(Number(item.lineTotal))}</span></li>)}</ul><div className="mt-5 space-y-2 border-t border-catalog-line pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(Number(session?.subtotal ?? cart?.subtotal ?? 0))}</span></div>{session && Number(session.discountTotal) > 0 ? <div className="flex justify-between text-brand-blue"><span>Descuento</span><span>-{formatMoney(Number(session.discountTotal))}</span></div> : null}{session && Number(session.shippingCost) > 0 ? <div className="flex justify-between"><span>Envío</span><span>{formatMoney(Number(session.shippingCost))}</span></div> : null}<div className="flex justify-between border-t border-catalog-line pt-3 font-semibold"><span>Total actual</span><strong className="font-display text-xl tabular-nums">{formatMoney(Number(session?.total ?? cart?.subtotal ?? 0))}</strong></div></div><p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted"><Truck size={18} className="mt-1 shrink-0 text-brand-blue" />El backend vuelve a validar stock, envío, promociones y total al confirmar.</p></aside>
    </form>
  );
}

function Confirmation({ order, guest }: SubmittedOrder) {
  const orderHref = guest ? `/pedido/${order.id}` : `/mi-cuenta/pedidos/${order.id}`;
  return <section className="rounded-xl bg-white p-7 sm:p-10" aria-live="polite"><CheckCircle size={42} weight="duotone" className="text-brand-blue" aria-hidden="true" /><h2 className="mt-5 font-display text-3xl font-semibold">Recibimos tu pedido</h2><p className="mt-3 max-w-xl text-lg leading-7 text-muted">La API creó el pedido <strong className="text-ink">{order.id}</strong> por {formatMoney(Number(order.total))}.</p><p className="mt-3 text-sm text-muted">Stock, precios, envío y promociones fueron validados por el backend.</p><div className="mt-7 flex flex-wrap gap-3"><Link href={orderHref} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white">Ver pedido <ArrowRight size={18} weight="bold" /></Link><Link href="/perros" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-catalog-canvas px-5 font-semibold text-ink">Seguir comprando</Link></div></section>;
}

function EmptyCheckout() {
  return <section className="rounded-xl bg-white p-7 sm:p-10"><h2 className="font-display text-2xl font-semibold">Tu carrito está vacío</h2><p className="mt-2 text-muted">Agregá un producto antes de continuar.</p><Link href="/perros" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand-blue px-5 font-semibold text-white">Ver productos</Link></section>;
}

function Field({ name, label, formStep, required = true, className = "", ...props }: { name: string; label: string; formStep: CheckoutStep; required?: boolean; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "name">) {
  return <label className={`font-semibold ${className}`}>{label}<input name={name} required={required} data-step={formStep} {...props} className="mt-2 h-12 w-full rounded-xl border border-catalog-line bg-white px-4 font-normal outline-none transition-colors placeholder:text-muted/70 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10" /></label>;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/commerce${path}`, { ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } });
  const payload = await response.json().catch(() => null) as T | { message?: string } | null;
  if (!response.ok) throw Object.assign(new Error(payload && typeof payload === "object" && "message" in payload ? payload.message : "Patitas API no pudo completar el paso."), { status: response.status });
  return payload as T;
}

function isConflict(cause: unknown) {
  return Boolean(cause && typeof cause === "object" && "status" in cause && cause.status === 409);
}

function stepFromStage(stage: CheckoutSession["stage"]): CheckoutStep {
  if (stage === "CONTACT") return 1;
  if (stage === "SHIPPING") return 2;
  return 3;
}

function splitContactName(name: string | null | undefined) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return { firstName: parts.shift() ?? "", lastName: parts.join(" ") };
}

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}
