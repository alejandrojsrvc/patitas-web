"use client";

import { ArrowLeft, ArrowRight, CalendarBlank, CheckCircle, Clock, CreditCard, LockKey, MapPin, ShieldCheck, Tag, Truck, UserCircle, Wallet } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type InputHTMLAttributes, useRef, useState } from "react";

import type { AvailablePaymentMethod, CheckoutConflict, CheckoutConfirmResult, CheckoutMutationResult, CheckoutSession, DeliverySlot, ShippingOption } from "@/domain/checkout/types";
import type { CustomerAddress } from "@/domain/customer/types";
import { formatMoney } from "@/lib/catalog-formatters";
import { useCart } from "@/features/cart/cart-context";
import { isIdempotencyConflict, paymentRedirectUrl } from "@/features/checkout/payment-flow";

type CheckoutStep = 1 | 2 | 3;

const steps = [
  { id: 1 as const, label: "Tus datos", Icon: UserCircle },
  { id: 2 as const, label: "Dirección", Icon: MapPin },
  { id: 3 as const, label: "Pago", Icon: CreditCard },
];

export function CheckoutForm({ initialSession, initialShippingOptions = [], initialPaymentMethods = [], savedAddresses = [] }: { initialSession: CheckoutSession | null; initialShippingOptions?: ShippingOption[]; initialPaymentMethods?: AvailablePaymentMethod[]; savedAddresses?: CustomerAddress[] }) {
  const { cart, items } = useCart();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const confirmIdempotencyKey = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const advancingStepRef = useRef(false);
  const [session, setSession] = useState<CheckoutSession | null>(initialSession);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(initialShippingOptions);
  const [selectedShippingOption, setSelectedShippingOption] = useState(initialSession?.shippingOptionId ?? "");
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>(slotsForOption(initialShippingOptions, initialSession?.shippingOptionId));
  const [selectedDeliverySlotId, setSelectedDeliverySlotId] = useState(initialSession?.shippingDeliverySlot ?? "");
  const [couponCode, setCouponCode] = useState(initialSession?.couponCode ?? "");
  const [couponLoading, setCouponLoading] = useState(false);
  const [step, setStep] = useState<CheckoutStep>(initialSession ? stepFromStage(initialSession.stage) : 1);
  const [loading, setLoading] = useState(false);
  const [paymentState, setPaymentState] = useState<"idle" | "creating-order" | "redirecting">("idle");
  const [error, setError] = useState<string | null>(null);
  const selectablePaymentMethods = initialPaymentMethods.filter((method) => method.paymentMethod !== "PAYWAY");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<AvailablePaymentMethod["paymentMethod"] | "">(
    initialSession?.paymentMethod === "PAYWAY" ? selectablePaymentMethods[0]?.paymentMethod ?? "" : initialSession?.paymentMethod ?? selectablePaymentMethods[0]?.paymentMethod ?? "",
  );
  const paymentAvailable = Boolean(selectedPaymentMethod);

  function updateShippingState(next: CheckoutSession, options: ShippingOption[]) {
    const optionId = next.shippingOptionId ?? "";
    const slots = slotsForOption(options, optionId);
    setSession(next);
    setShippingOptions(options);
    setSelectedShippingOption(optionId);
    setDeliverySlots(slots);
    setSelectedDeliverySlotId(next.shippingDeliverySlot ?? "");
  }

  function recoverConflict(cause: unknown) {
    if (cause instanceof CheckoutRequestError && cause.currentState) {
      updateShippingState(cause.currentState.session, cause.currentState.shippingOptions);
    }
  }

  async function applyCoupon() {
    if (!session || !couponCode.trim()) return;
    setCouponLoading(true);
    setError(null);
    try {
      const result = await requestJson<CheckoutMutationResult>(`/checkout/sessions/${session.id}/coupon`, { method: "POST", body: JSON.stringify({ code: couponCode.trim() }) });
      updateShippingState(result.session, result.shippingOptions);
      setCouponCode(result.session.couponCode ?? couponCode.trim().toUpperCase());
    } catch (cause) {
      if (isConflict(cause)) recoverConflict(cause);
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
      const result = await requestJson<CheckoutMutationResult>(`/checkout/sessions/${session.id}/coupon`, { method: "DELETE" });
      updateShippingState(result.session, result.shippingOptions);
      setCouponCode("");
    } catch (cause) {
      if (isConflict(cause)) recoverConflict(cause);
      setError(errorMessage(cause, "No pudimos quitar el cupón."));
    } finally {
      setCouponLoading(false);
    }
  }

  async function selectDeliverySlot(slot: DeliverySlot) {
    if (!session || loading || !selectedShippingOption || slot.id === selectedDeliverySlotId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await requestJson<CheckoutMutationResult>(`/checkout/sessions/${session.id}/shipping-option`, {
        method: "PATCH",
        body: JSON.stringify({ shippingOptionId: selectedShippingOption, deliverySlotId: slot.id }),
      });
      updateShippingState(result.session, result.shippingOptions);
    } catch (cause) {
      if (isConflict(cause)) recoverConflict(cause);
      setError(errorMessage(cause, "No pudimos actualizar el horario de entrega."));
    } finally {
      setLoading(false);
    }
  }

  async function selectShippingOption(shippingOptionId: string) {
    if (!session || loading || shippingOptionId === selectedShippingOption) return;
    const option = shippingOptions.find((item) => item.id === shippingOptionId);
    const slotId = option?.deliverySlots[0]?.id;
    if (!option || !slotId) {
      setError("No hay horarios disponibles para este envío.");
      return;
    }
    setSelectedShippingOption(shippingOptionId);
    setLoading(true);
    setError(null);
    try {
      const result = await requestJson<CheckoutMutationResult>(`/checkout/sessions/${session.id}/shipping-option`, {
        method: "PATCH",
        body: JSON.stringify({ shippingOptionId, deliverySlotId: slotId }),
      });
      updateShippingState(result.session, result.shippingOptions);
    } catch (cause) {
      setSelectedShippingOption(session.shippingOptionId ?? "");
      if (isConflict(cause)) recoverConflict(cause);
      setError(errorMessage(cause, "No pudimos actualizar el envío."));
    } finally {
      setLoading(false);
    }
  }

  function validateStep(targetStep: CheckoutStep) {
    if (!formRef.current) return false;
    const fields = Array.from(formRef.current.elements).filter((element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement => {
      const isField = element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement;
      return isField && element.dataset.step === String(targetStep);
    });
    const invalid = fields.find((field) => !field.checkValidity());
    if (invalid) { invalid.reportValidity(); return false; }
    return true;
  }

  async function goNext() {
    if (loading || advancingStepRef.current || !validateStep(step) || !session) return;
    advancingStepRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData(formRef.current!);
      if (step === 1) {
        const fullName = `${form.get("firstName") ?? ""} ${form.get("lastName") ?? ""}`.trim();
        const result = await requestJson<CheckoutMutationResult>(`/checkout/sessions/${session.id}/contact`, { method: "PATCH", body: JSON.stringify({ contactName: fullName, contactEmail: form.get("email"), contactPhone: form.get("phone") || null }) });
        updateShippingState(result.session, result.shippingOptions);
      }
      if (step === 2) {
        const result = await requestJson<CheckoutMutationResult>(`/checkout/sessions/${session.id}/shipping-address`, { method: "PATCH", body: JSON.stringify({ address: { recipientName: `${form.get("firstName") ?? ""} ${form.get("lastName") ?? ""}`.trim(), street: form.get("street"), number: form.get("number"), apartment: form.get("apartment") || "", neighborhood: form.get("neighborhood") || "", city: form.get("city"), province: form.get("province"), postalCode: form.get("postalCode"), reference: form.get("reference") || "" } }) });
        updateShippingState(result.session, result.shippingOptions);
      }
      setStep((current) => Math.min(3, current + 1) as CheckoutStep);
    } catch (cause) {
      if (isConflict(cause)) recoverConflict(cause);
      setError(errorMessage(cause, "No pudimos guardar este paso."));
    } finally {
      advancingStepRef.current = false;
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || submittingRef.current) return;
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
    if (!selectedDeliverySlotId) {
      setError("Elegí un horario de entrega para continuar.");
      return;
    }
    if (!paymentAvailable) {
      setError("El pago online no está disponible en este momento. Intentá nuevamente más tarde.");
      return;
    }
    if (!validateStep(3)) {
      setError("Aceptá los términos y condiciones para continuar.");
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    setPaymentState("creating-order");
    setError(null);
    let redirecting = false;
    try {
      let current = session;
      if (current.shippingOptionId !== shippingOptionId || current.shippingDeliverySlot !== selectedDeliverySlotId) {
        const result = await requestJson<CheckoutMutationResult>(`/checkout/sessions/${session.id}/shipping-option`, { method: "PATCH", body: JSON.stringify({ shippingOptionId, deliverySlotId: selectedDeliverySlotId }) });
        current = result.session;
        updateShippingState(result.session, result.shippingOptions);
      }
      if (current.paymentMethod !== selectedPaymentMethod) {
        const result = await requestJson<CheckoutMutationResult>(`/checkout/sessions/${session.id}/payment-method`, { method: "PATCH", body: JSON.stringify({ paymentMethod: selectedPaymentMethod }) });
        current = result.session;
        updateShippingState(result.session, result.shippingOptions);
      }
      const idempotencyKey = confirmIdempotencyKey.current ?? crypto.randomUUID();
      confirmIdempotencyKey.current = idempotencyKey;
      const result = await requestJson<CheckoutConfirmResult>(`/checkout/sessions/${session.id}/confirm`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        // Nest actualmente acepta únicamente {} para Mercado Pago. La
        // aceptación de términos se valida localmente en este formulario.
        body: JSON.stringify({}),
      });
      if (!result.payment) {
        // Una sesión completada cuya orden ya está pagada puede no incluir
        // una nueva iniciación de pago. La pantalla de resultado consulta la
        // Order y decide el estado real.
        router.replace("/checkout/resultado");
        return;
      }
      if (result.payment.action === "REDIRECT") {
        const paymentUrl = paymentRedirectUrl(result.payment);
        if (!paymentUrl) {
          throw Object.assign(new Error("La plataforma de pago no devolvió una URL válida."), { code: "PAYMENT_PROVIDER_UNAVAILABLE" });
        }
        setPaymentState("redirecting");
        redirecting = true;
        window.location.assign(paymentUrl);
      } else {
        // La respuesta de Nest puede indicar el resultado de la operación, pero
        // la pantalla de resultado siempre vuelve a consultar la Order.
        router.replace("/checkout/resultado");
      }
    } catch (cause) {
      if (isIdempotencyConflict(cause)) {
        setError("Este intento ya fue procesado o usa una clave incompatible. No iniciamos otro pago; revisá el estado del pedido.");
      } else {
        confirmIdempotencyKey.current = null;
        if (isConflict(cause)) recoverConflict(cause);
        setError(paymentErrorMessage(cause));
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
      if (!redirecting) setPaymentState("idle");
    }
  }

  const checkoutItems = session?.items ?? items;
  if (!checkoutItems.length) return <EmptyCheckout />;
  if (!session) return <MissingCheckoutSession />;

  const contact = splitContactName(session.contactName);
  const address = session.shippingAddress;

  function fillSavedAddress(addressId: string) {
    const saved = savedAddresses.find((item) => item.id === addressId);
    if (!saved || !formRef.current) return;
    const recipientParts = splitContactName(saved.recipientName);
    const values: Record<string, string> = { firstName: recipientParts.firstName, lastName: recipientParts.lastName, street: saved.street, number: saved.number, apartment: saved.apartment ?? "", neighborhood: saved.neighborhood ?? "", city: saved.city, province: saved.province, postalCode: saved.postalCode, reference: saved.reference ?? "" };
    for (const [name, value] of Object.entries(values)) {
      const field = formRef.current.elements.namedItem(name);
      if (field instanceof HTMLInputElement) field.value = value;
    }
  }

  return (
    <form key={session?.id ?? "checkout"} ref={formRef} onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
      <div>
        <ol className="mb-7 grid grid-cols-3 gap-2" aria-label="Progreso del checkout">
          {steps.map(({ id, label, Icon }) => <li key={id} aria-current={step === id ? "step" : undefined} className={`relative flex min-w-0 items-center gap-2 border-b-2 pb-3 text-sm ${step >= id ? "border-brand-blue font-semibold text-ink" : "border-catalog-line text-muted"}`}><span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${step >= id ? "bg-brand-blue text-white" : "border border-border bg-catalog-canvas text-muted"}`}>{step > id ? <CheckCircle size={17} weight="bold" aria-hidden="true" /> : <Icon size={17} weight={step === id ? "bold" : "regular"} aria-hidden="true" />}</span><span className="hidden sm:inline">{label}</span></li>)}
        </ol>

        <fieldset hidden={step !== 1} className="rounded-2xl border border-border bg-white p-4 shadow-[0_10px_30px_rgba(22,24,29,0.04)] sm:p-7">
          <legend className="px-1 font-display text-lg font-semibold sm:text-xl">Tus datos</legend>
          <p className="mb-6 mt-2 text-sm text-muted">¿A quién contactamos sobre este pedido?</p>
          <div className="grid gap-4 sm:grid-cols-2"><Field name="firstName" label="Nombre" formStep={1} defaultValue={contact.firstName} autoComplete="given-name" /><Field name="lastName" label="Apellido" formStep={1} defaultValue={contact.lastName} autoComplete="family-name" /><Field name="phone" label="Teléfono" formStep={1} defaultValue={session?.contactPhone ?? ""} type="tel" inputMode="tel" autoComplete="tel" placeholder="11 1234-5678" /><Field name="email" label="Correo electrónico" formStep={1} defaultValue={session?.contactEmail ?? ""} type="email" autoComplete="email" placeholder="vos@ejemplo.com" className="sm:col-span-2" /></div>
        </fieldset>

        <fieldset hidden={step !== 2} className="rounded-2xl border border-border bg-white p-4 shadow-[0_10px_30px_rgba(22,24,29,0.04)] sm:p-7">
          <legend className="px-1 font-display text-lg font-semibold sm:text-xl">Dirección de entrega</legend>
          <p className="mb-6 mt-2 text-sm text-muted">Indicá dónde querés recibirlo.</p>
          {savedAddresses.length ? <label className="mb-5 block text-sm font-semibold">Usar una dirección guardada<select defaultValue="" onChange={(event) => fillSavedAddress(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-catalog-line bg-white px-4 font-normal focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"><option value="">Elegir dirección…</option>{savedAddresses.map((saved) => <option key={saved.id} value={saved.id}>{saved.label} — {saved.street} {saved.number}</option>)}</select></label> : null}
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]"><Field name="street" label="Calle" formStep={2} defaultValue={address?.street ?? ""} autoComplete="street-address" placeholder="Ej. Avenida Corrientes" /><Field name="number" label="Número" formStep={2} defaultValue={address?.number ?? ""} inputMode="numeric" autoComplete="address-line1" placeholder="1234" /><Field name="apartment" label="Piso / departamento" formStep={2} defaultValue={address?.apartment ?? ""} required={false} autoComplete="address-line2" placeholder="Opcional" /><Field name="postalCode" label="Código postal" formStep={2} defaultValue={address?.postalCode ?? ""} autoComplete="postal-code" placeholder="C1000AAA o 1000" pattern="[A-Za-z]?[0-9]{4}([A-Za-z]{3})?" onInput={(event) => { event.currentTarget.value = event.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); }} /><Field name="neighborhood" label="Barrio / localidad" formStep={2} defaultValue={address?.neighborhood ?? ""} autoComplete="address-level2" required={false} className="sm:col-span-2" placeholder="Ej. Palermo" /><Field name="city" label="Ciudad" formStep={2} defaultValue={address?.city ?? "Buenos Aires"} autoComplete="address-level2" /><Field name="province" label="Provincia" formStep={2} defaultValue={address?.province ?? "Buenos Aires"} autoComplete="address-level1" /><Field name="reference" label="Indicaciones" formStep={2} defaultValue={address?.reference ?? ""} required={false} className="sm:col-span-2" placeholder="Timbre, acceso, referencia…" /></div>
        </fieldset>

        <fieldset hidden={step !== 3} className="rounded-2xl border border-border bg-white p-4 shadow-[0_10px_30px_rgba(22,24,29,0.04)] sm:p-7">
          <legend className="px-1 font-display text-lg font-semibold sm:text-xl">Pago</legend>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Revisá la entrega y elegí un medio de pago.</p>
          {session?.stage === "CONFIRMATION" ? <p className="mt-4 rounded-lg bg-[#f3f5f7] p-3 text-sm font-semibold text-ink">Todo listo para confirmar.</p> : null}

          <section className="mt-6 rounded-xl border border-catalog-line bg-[#f7f7f5] p-4 sm:p-5" aria-labelledby="delivery-title">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-soft-blue text-brand-blue"><Truck size={21} weight="bold" aria-hidden="true" /></span>
              <div className="min-w-0"><h2 id="delivery-title" className="font-display text-lg font-semibold">Entrega a domicilio</h2><p className="mt-1 text-sm text-muted">Elegí una de las franjas disponibles para tu dirección.</p></div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-white p-3"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"><Clock size={15} className="text-brand-blue" aria-hidden="true" /> Horario</p><p className="mt-1 font-semibold">{selectedSlot(deliverySlots, selectedDeliverySlotId)?.label ?? "A elegir"}</p></div>
              <div className="rounded-lg border border-border bg-white p-3"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"><CalendarBlank size={15} className="text-brand-blue" aria-hidden="true" /> Entrega</p><p className="mt-1 font-semibold">{formatDeliveryDate(session.shippingDeliveryDate) ?? session.shippingEstimate ?? "A confirmar"}</p></div>
            </div>
            <div className="mt-4 border-t border-border pt-4"><p className="text-sm font-semibold">Costo de entrega</p>{shippingOptions.length ? <div className="mt-3 grid gap-2">{shippingOptions.map((option) => <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${selectedShippingOption === option.id ? "border-brand-blue bg-soft-blue" : "border-border bg-white hover:border-brand-blue/50"}`}><input type="radio" name="shippingOption" value={option.id} checked={selectedShippingOption === option.id} onChange={() => void selectShippingOption(option.id)} disabled={loading} className="accent-brand-blue" /><span className="min-w-0 flex-1"><span className="block font-semibold">Envío a domicilio</span><span className="mt-0.5 block text-sm text-muted">Costo calculado para tu dirección</span></span><strong className="shrink-0 text-sm tabular-nums">{formatMoney(Number(option.cost))}</strong></label>)}</div> : <p className="mt-3 rounded-lg bg-[#fff1f1] p-3 text-sm text-[#8d2020]">No hay opciones disponibles para esta dirección.</p>}</div>
            {deliverySlots.length ? <div className="mt-4 border-t border-border pt-4"><p className="text-sm font-semibold">Elegí cuándo recibir</p><div className="mt-3 grid gap-2">{deliverySlots.map((slot) => <button key={slot.id} type="button" onClick={() => void selectDeliverySlot(slot)} disabled={loading} className={`flex min-h-14 items-center justify-between gap-3 rounded-lg border px-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${selectedDeliverySlotId === slot.id ? "border-brand-blue bg-soft-blue" : "border-border bg-white hover:border-brand-blue/50"} disabled:cursor-not-allowed disabled:opacity-50`}><span><span className="block font-semibold">{slot.label}</span><span className="mt-0.5 block text-sm text-muted">{formatSlotHours(slot)}</span></span>{selectedDeliverySlotId === slot.id ? <CheckCircle size={21} weight="fill" className="shrink-0 text-brand-blue" aria-label="Seleccionado" /> : null}</button>)}</div></div> : <p className="mt-4 flex items-start gap-2 border-t border-border pt-4 text-sm text-muted"><Clock size={17} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />No hay horarios disponibles para esta dirección.</p>}
          </section>

          <section className="mt-6" aria-labelledby="payment-methods-title">
            <div className="flex items-end justify-between gap-3"><div><h2 id="payment-methods-title" className="font-display text-lg font-semibold">Medio de pago</h2><p className="mt-1 text-sm text-muted">{paymentAvailable ? "Elegí cómo querés completar el pago." : "No hay un medio de pago disponible en este momento."}</p></div><LockKey size={19} className="text-brand-blue" aria-hidden="true" /></div>
            {selectablePaymentMethods.length ? <div className="mt-4 grid gap-2">{selectablePaymentMethods.map((method) => <label key={method.paymentMethod} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${selectedPaymentMethod === method.paymentMethod ? "border-brand-blue bg-soft-blue" : "border-border bg-white"}`}><input type="radio" name="paymentMethod" value={method.paymentMethod} checked={selectedPaymentMethod === method.paymentMethod} onChange={() => setSelectedPaymentMethod(method.paymentMethod)} className="accent-brand-blue" /><span className="font-semibold">{paymentMethodLabel(method.paymentMethod)}</span></label>)}</div> : <p className="mt-4 rounded-lg bg-[#fff1f1] p-3 text-sm text-[#8d2020]">No hay un medio de pago compatible disponible.</p>}
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-[#f7f7f5] p-3 text-sm leading-5 text-muted"><ShieldCheck size={19} weight="bold" className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" /><p><strong className="font-semibold text-ink">Datos protegidos.</strong><span className="mt-0.5 block">El pago se procesa fuera de Patitas; solo recibimos el estado confirmado por la plataforma.</span></p></div>
          </section>

          <section className="mt-6 rounded-xl border border-border bg-[#f7f7f5] p-4" aria-labelledby="coupon-title"><div className="flex items-center gap-2"><Tag size={18} className="text-brand-blue" aria-hidden="true" /><h2 id="coupon-title" className="text-sm font-semibold">Cupón de descuento</h2></div><div className="mt-3 flex gap-2"><input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} aria-label="Código de cupón" placeholder="Ingresá tu código" className="h-11 min-w-0 flex-1 rounded-lg border border-catalog-line bg-white px-3 uppercase focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue" disabled={Boolean(session.couponCode) || couponLoading} /><button type="button" onClick={() => void applyCoupon()} disabled={!couponCode.trim() || Boolean(session.couponCode) || couponLoading} className="min-h-11 rounded-lg border border-ink bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-[#303136] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:opacity-50">Aplicar</button></div>{session.couponCode ? <p className="mt-2 flex items-center justify-between gap-3 text-sm text-muted"><span>Cupón aplicado: <strong className="text-ink">{session.couponCode}</strong></span><button type="button" onClick={() => void clearCoupon()} disabled={couponLoading} className="font-semibold text-brand-blue hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">Quitar</button></p> : null}</section>
          <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-muted"><input name="terms" type="checkbox" required data-step="3" className="mt-1 size-4 accent-brand-blue" /><span>Leí y acepto los <Link href="/terminos" className="font-semibold text-brand-blue underline">términos y condiciones</Link> y la <Link href="/privacidad" className="font-semibold text-brand-blue underline">política de privacidad</Link>.</span></label>
        </fieldset>

        {paymentState !== "idle" ? <p role="status" className="mt-5 rounded-xl bg-soft-blue p-4 text-sm text-ink">{paymentState === "redirecting" ? "Redirigiendo a la plataforma de pago…" : "Procesando el pago…"}</p> : null}
        {error ? <p role="alert" className="mt-5 rounded-xl bg-[#fff1f1] p-4 text-sm text-[#8d2020]">{error}</p> : null}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-between">{step > 1 ? <button type="button" onClick={() => { setStep((current) => Math.max(1, current - 1) as CheckoutStep); setError(null); }} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-catalog-canvas px-4 font-semibold text-ink transition-colors hover:bg-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue sm:w-auto sm:px-5"><ArrowLeft size={17} /> Volver</button> : <span />}{step < 3 ? <button type="button" onClick={() => void goNext()} disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 font-semibold text-white transition-colors hover:bg-[#0048dc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-60 sm:w-auto sm:px-5">{loading ? "Guardando…" : "Continuar"}<ArrowRight size={17} weight="bold" /></button> : <button type="submit" disabled={loading || !paymentAvailable} className="inline-flex min-h-13 w-full items-center justify-center gap-3 rounded-xl bg-[#009ee3] px-5 font-semibold text-white shadow-[0_8px_18px_rgba(0,158,227,0.2)] transition-[background-color,box-shadow,opacity] hover:bg-[#008bc7] hover:shadow-[0_10px_22px_rgba(0,158,227,0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-56"><span className="flex size-8 items-center justify-center rounded-full bg-white/15"><Wallet size={18} weight="bold" aria-hidden="true" /></span><span>{loading ? (paymentState === "redirecting" ? "Redirigiendo…" : "Conectando…") : paymentAvailable ? `Continuar con ${paymentMethodLabel(selectedPaymentMethod)}` : "Pago no disponible"}</span><ArrowRight size={18} weight="bold" aria-hidden="true" /></button>}</div>
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_rgba(22,24,29,0.04)] sm:sticky sm:top-6 sm:p-6" aria-labelledby="checkout-summary-title"><h2 id="checkout-summary-title" className="font-display text-xl font-semibold">Resumen</h2><ul className="mt-5 space-y-3 text-sm">{(session?.items ?? items).map((item) => <li key={item.variantId} className="flex justify-between gap-3"><span className="min-w-0"><span className="block truncate">{item.quantity} × {item.productName}</span><span className="block text-xs text-muted">{item.presentation ?? "Presentación"}</span></span><span className="shrink-0 tabular-nums">{formatMoney(Number(item.lineTotal))}</span></li>)}</ul><div className="mt-5 space-y-2 border-t border-catalog-line pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(Number(session?.subtotal ?? cart?.subtotal ?? 0))}</span></div>{session && Number(session.discountTotal) > 0 ? <div className="flex justify-between text-brand-blue"><span>Descuento</span><span>-{formatMoney(Number(session.discountTotal))}</span></div> : null}{session && Number(session.shippingCost) > 0 ? <div className="flex justify-between"><span>Envío</span><span>{formatMoney(Number(session.shippingCost))}</span></div> : null}<div className="flex justify-between border-t border-catalog-line pt-3 font-semibold"><span>Total</span><strong className="font-display text-xl tabular-nums">{formatMoney(Number(session?.total ?? cart?.subtotal ?? 0))}</strong></div></div><p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted"><LockKey size={18} className="mt-1 shrink-0 text-brand-blue" />Importe y envío calculados por Patitas.</p></aside>
    </form>
  );
}

function EmptyCheckout() {
  return <section className="rounded-xl bg-white p-7 sm:p-10"><h2 className="font-display text-xl font-semibold">Tu carrito está vacío</h2><p className="mt-2 text-muted">Agregá un producto antes de continuar.</p><Link href="/perros" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand-blue px-5 font-semibold text-white">Ver productos</Link></section>;
}

function MissingCheckoutSession() {
  return <section className="rounded-xl bg-white p-7 sm:p-10"><h2 className="font-display text-xl font-semibold">No pudimos recuperar este checkout</h2><p className="mt-2 max-w-xl text-muted">Tu carrito sigue disponible. Volvé a iniciarlo para recalcular stock, envío y total antes de pagar.</p><Link href="/checkout/iniciar" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand-blue px-5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">Reintentar checkout</Link></section>;
}

function Field({ name, label, formStep, required = true, className = "", ...props }: { name: string; label: string; formStep: CheckoutStep; required?: boolean; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "name">) {
  return <label className={`font-semibold ${className}`}>{label}<input name={name} required={required} data-step={formStep} {...props} className="mt-2 h-12 w-full rounded-xl border border-catalog-line bg-white px-4 font-normal transition-colors placeholder:text-muted/70 focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue" /></label>;
}

function slotsForOption(options: ShippingOption[], optionId: string | null | undefined) {
  if (!optionId) return [];
  return options.find((option) => option.id === optionId)?.deliverySlots ?? [];
}

function selectedSlot(slots: DeliverySlot[], slotId: string) {
  return slots.find((slot) => slot.id === slotId) ?? null;
}

function formatSlotHours(slot: DeliverySlot) {
  return `${slot.start} a ${slot.end}`;
}

function paymentMethodLabel(method: AvailablePaymentMethod["paymentMethod"] | "") {
  return ({ MERCADO_PAGO: "Mercado Pago", PAYWAY: "Payway", SIMULATED_CARD: "pago de prueba" } as Record<string, string>)[method] ?? "medio de pago";
}

function formatDeliveryDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/commerce${path}`, { ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } });
  const payload = await response.json().catch(() => null) as T | CheckoutConflict | { message?: string; code?: string } | null;
  if (!response.ok) {
    const errorPayload = payload && typeof payload === "object" ? payload as CheckoutConflict : null;
    throw new CheckoutRequestError(
      errorPayload?.message ?? "Patitas API no pudo completar el paso.",
      response.status,
      errorPayload?.code,
      errorPayload?.currentState,
    );
  }
  return payload as T;
}

class CheckoutRequestError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly currentState?: CheckoutMutationResult,
  ) {
    super(message);
    this.name = "CheckoutRequestError";
  }
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

function paymentErrorMessage(cause: unknown) {
  if (cause && typeof cause === "object" && "code" in cause) {
    if (cause.code === "PAYMENT_PROVIDER_UNAVAILABLE") return "La pasarela de pago no está disponible en este momento. Intentá nuevamente en unos minutos.";
    if (cause.code === "PAYMENT_IDEMPOTENCY_CONFLICT") return "Este intento de pago ya existe. Consultá el estado del pedido antes de volver a intentarlo.";
  }
  const message = errorMessage(cause, "No pudimos confirmar el pedido. Revisá stock, envío y datos.");
  if (/ya está pagado|ya fue pagado/i.test(message)) return "Este pedido ya figura como pagado.";
  if (/expiró|expirada|expirado/i.test(message)) return "La sesión u orden expiró. Volvé al carrito para iniciar un checkout nuevo.";
  if (/proveedor|pasarela|disponible/i.test(message)) return "La pasarela de pago no está disponible en este momento. Intentá nuevamente en unos minutos.";
  return message;
}
