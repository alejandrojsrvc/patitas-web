"use client";

import {
  ArrowRight,
  CalendarBlank,
  CaretDown,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  LockKey,
  MapPin,
  PencilSimple,
  ShieldCheck,
  Tag,
  Truck,
  UserCircle,
  Wallet,
  X,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type InputHTMLAttributes, type ReactNode, type RefObject, useEffect, useId, useRef, useState } from "react";

import type {
  AvailablePaymentMethod,
  CheckoutConflict,
  CheckoutConfirmResult,
  CheckoutCustomerSummary,
  CheckoutMutationResult,
  CheckoutSession,
  DeliverySlot,
  ShippingOption,
} from "@/domain/checkout/types";
import type { CustomerAddress, CustomerAddressInput, CustomerPet } from "@/domain/customer/types";
import type { StorefrontViewer } from "@/domain/storefront/types";
import { formatMoney } from "@/lib/catalog-formatters";
import { useCart } from "@/features/cart/cart-context";
import { checkoutAttemptKey, isIdempotencyConflict, paymentRedirectUrl } from "@/features/checkout/payment-flow";
import { GoogleAddressAutocomplete, type GoogleAddressSelection } from "@/features/checkout/google-address-autocomplete";
import { isTurnstileConfigured, TurnstileWidget } from "@/components/security/turnstile-widget";
import { notifySessionChanged } from "@/features/session/session-shell-context";
import { usePetShopping } from "@/features/pets/pet-shopping-context";
import {
  hasRequiredDeliveryDetails,
  isValidEmail,
  isValidPhone,
  joinApartment,
  normalizeArgentinePostalCode,
  splitApartment,
} from "./address-fields";

type EditingSection = "contact" | "shipping" | null;
type AddressEditorMode = "details" | "choose" | "new";
type ContactDraft = { firstName: string; lastName: string; phone: string; email: string };
type AddressDraft = {
  label: string;
  street: string;
  number: string;
  floor: string;
  department: string;
  neighborhood: string;
  city: string;
  province: string;
  postalCode: string;
  reference: string;
};
type PaywayTokenResponse = { token?: unknown; id?: unknown; status?: unknown };
type PaywaySdk = {
  setPublishableKey: (key: string) => void;
  setTimeout: (timeout: number) => void;
  createToken: (form: HTMLFormElement, callback: (status: number, response: PaywayTokenResponse) => void) => void;
};

declare global {
  interface Window {
    Decidir?: new (url: string, disableCyberSource?: boolean) => PaywaySdk;
  }
}

const PAYWAY_SDK_URL = "https://ventasonline.payway.com.ar/static/v2.6.4/decidir.js";
const PAYWAY_API_URL =
  process.env.NEXT_PUBLIC_PAYWAY_ENVIRONMENT === "sandbox"
    ? "https://developers.decidir.com/api/v2"
    : "https://ventasonline.payway.com.ar/api/v2";
const paywayPublicApiKey = process.env.NEXT_PUBLIC_PAYWAY_PUBLIC_API_KEY?.trim() ?? "";
// Son códigos de medios de pago de Payway, no credenciales ni IDs de establecimiento.
const PAYWAY_DEBIT_PAYMENT_METHODS = { visa: 31, mastercard: 66, cabal: 67 } as const;
let paywaySdkPromise: Promise<void> | null = null;

export function CheckoutForm({
  initialSession,
  initialShippingOptions = [],
  initialPaymentMethods = [],
  savedAddresses = [],
  initialViewer,
  initialCustomer,
}: {
  initialSession: CheckoutSession | null;
  initialShippingOptions?: ShippingOption[];
  initialPaymentMethods?: AvailablePaymentMethod[];
  savedAddresses?: CustomerAddress[];
  initialViewer?: StorefrontViewer;
  initialCustomer?: CheckoutCustomerSummary | null;
}) {
  const { items } = useCart();
  const { pets } = usePetShopping();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const accountPrefillRef = useRef(false);
  const initialSavedAddress = savedAddresses.find((item) => item.isDefault) ?? savedAddresses[0] ?? null;
  const initialContact = contactFromData(initialSession, initialCustomer, initialViewer, initialSavedAddress);
  const initialAddress = initialSession?.shippingAddress
    ? addressFromCheckout(initialSession.shippingAddress)
    : initialSavedAddress
      ? addressFromSaved(initialSavedAddress)
      : emptyAddress();
  const hasContactData = Boolean(initialSession?.contactName && initialSession?.contactEmail && initialSession?.contactPhone);
  const hasAddressData =
    Boolean(initialSession?.shippingAddress && Object.values(initialSession.shippingAddress).some(Boolean)) || Boolean(initialSavedAddress);

  const [session, setSession] = useState<CheckoutSession | null>(initialSession);
  const initialVisibleOptions = orderShippingOptions(initialShippingOptions);
  const [shippingOptions, setShippingOptions] = useState(initialVisibleOptions);
  const initialOptionId = initialSession?.shippingDeliverySlot ? (initialSession.shippingOptionId ?? "") : "";
  const [selectedShippingOption, setSelectedShippingOption] = useState(initialOptionId);
  const [deliverySlots, setDeliverySlots] = useState(slotsForOption(initialVisibleOptions, initialOptionId));
  const initialSlot = slotsForOption(initialVisibleOptions, initialOptionId).find(
    (slot) => slot.id === initialSession?.shippingDeliverySlot && sameDeliveryDate(slot.date, initialSession?.shippingDeliveryDate),
  );
  const [selectedDeliverySlotId, setSelectedDeliverySlotId] = useState(initialSlot ? slotKey(initialSlot) : "");
  const [paymentStepRevealed, setPaymentStepRevealed] = useState(
    Boolean(
      initialSession?.paymentMethod ||
      (initialSession?.shippingAddress && initialSession.shippingOptionId && initialSession.shippingDeliverySlot),
    ),
  );
  const [savedAddressList, setSavedAddressList] = useState(savedAddresses);
  const [contactDraft, setContactDraft] = useState(initialContact);
  const [addressDraft, setAddressDraft] = useState(initialAddress);
  const floorInputRef = useRef<HTMLInputElement>(null);
  const [addressEditorMode, setAddressEditorMode] = useState<AddressEditorMode>(() =>
    initialAddress.street && initialAddress.number ? "details" : savedAddresses.length ? "choose" : "new",
  );
  const [editingSection, setEditingSection] = useState<EditingSection>(() =>
    !hasContactData ? "contact" : !hasAddressData ? "shipping" : null,
  );
  const [editingAddressId, setEditingAddressId] = useState<string | null>(
    initialSession?.shippingAddress
      ? (savedAddresses.find(
          (saved) =>
            saved.street === initialSession.shippingAddress?.street &&
            saved.number === initialSession.shippingAddress?.number &&
            saved.postalCode === initialSession.shippingAddress?.postalCode,
        )?.id ?? null)
      : (initialSavedAddress?.id ?? null),
  );
  const [saveAddressForLater, setSaveAddressForLater] = useState(false);
  const [accountPrefilling, setAccountPrefilling] = useState(
    Boolean(
      initialSession &&
      initialSession.paymentMethod !== "MERCADO_PAGO" &&
      initialPaymentMethods.some((method) => method.paymentMethod === "MERCADO_PAGO"),
    ),
  );
  const [couponCode, setCouponCode] = useState(initialSession?.couponCode ?? "");
  const [couponLoading, setCouponLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<7 | 14 | 21 | 30>(
    (initialSession?.scheduledPurchase?.frequencyDays as 7 | 14 | 21 | 30 | undefined) ?? 30,
  );
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [shippingSelectionLoading, setShippingSelectionLoading] = useState(false);
  const [paymentState, setPaymentState] = useState<"idle" | "tokenizing" | "creating-order" | "redirecting">("idle");
  const [paywaySdkStatus, setPaywaySdkStatus] = useState<"idle" | "loading" | "ready" | "missing-config" | "error">("idle");
  const paywaySdkRef = useRef<PaywaySdk | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [sessionInvalid, setSessionInvalid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionAlertRef = useRef<HTMLDivElement>(null);
  const selectablePaymentMethods = initialPaymentMethods.filter((method) => method.paymentMethod === "MERCADO_PAGO");
  const busy = loading || couponLoading || scheduleLoading || accountPrefilling || paymentState !== "idle";
  const anonymousCheckout = !initialViewer?.authenticated;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<AvailablePaymentMethod["paymentMethod"] | "">(
    initialSession?.paymentMethod && selectablePaymentMethods.some((method) => method.paymentMethod === initialSession.paymentMethod)
      ? initialSession.paymentMethod
      : (selectablePaymentMethods[0]?.paymentMethod ?? ""),
  );

  useEffect(() => {
    if (selectedPaymentMethod !== "PAYWAY" || !paywayPublicApiKey) return;
    void loadPaywaySdk()
      .then(() => {
        if (!window.Decidir) throw new Error("No pudimos cargar el medio de pago.");
        const decidir = new window.Decidir(PAYWAY_API_URL);
        decidir.setPublishableKey(paywayPublicApiKey);
        decidir.setTimeout(5000);
        paywaySdkRef.current = decidir;
        setPaywaySdkStatus("ready");
      })
      .catch(() => setPaywaySdkStatus("error"));
  }, [selectedPaymentMethod]);

  useEffect(() => {
    const handleInvalidSession = () => setSessionInvalid(true);
    window.addEventListener("patitas-session-invalid", handleInvalidSession);
    return () => window.removeEventListener("patitas-session-invalid", handleInvalidSession);
  }, []);

  useEffect(() => {
    if (sessionInvalid) sessionAlertRef.current?.focus();
  }, [sessionInvalid]);

  function updateShippingState(next: CheckoutSession, options: ShippingOption[]) {
    const visibleOptions = orderShippingOptions(options);
    const optionId = next.shippingDeliverySlot ? (next.shippingOptionId ?? "") : "";
    setSession(next);
    setShippingOptions(visibleOptions);
    setSelectedShippingOption(optionId);
    setDeliverySlots(slotsForOption(visibleOptions, optionId));
    const nextSlot = slotsForOption(visibleOptions, optionId).find(
      (slot) => slot.id === next.shippingDeliverySlot && sameDeliveryDate(slot.date, next.shippingDeliveryDate),
    );
    setSelectedDeliverySlotId(nextSlot ? slotKey(nextSlot) : "");
  }

  function resetDeliverySelection() {
    setSelectedShippingOption("");
    setDeliverySlots([]);
    setSelectedDeliverySlotId("");
  }

  function recoverConflict(cause: unknown) {
    if (cause instanceof CheckoutRequestError && cause.currentState)
      updateShippingState(cause.currentState.session, cause.currentState.shippingOptions);
  }

  useEffect(() => {
    if (
      !session ||
      session.status !== "DRAFT" ||
      accountPrefillRef.current ||
      (session.paymentMethod === selectedPaymentMethod &&
        Boolean(session.contactName && session.contactEmail) &&
        (!initialSavedAddress || Boolean(session.shippingAddress)))
    )
      return;
    accountPrefillRef.current = true;
    let active = true;
    void (async () => {
      setAccountPrefilling(true);
      try {
        let current = session;
        if (selectedPaymentMethod && current.paymentMethod !== selectedPaymentMethod) {
          const result = await requestJson<CheckoutMutationResult>("/checkout/sessions/" + current.id + "/payment-method", {
            method: "PATCH",
            body: JSON.stringify({ paymentMethod: selectedPaymentMethod }),
          });
          current = result.session;
          if (active) updateShippingState(result.session, result.shippingOptions);
        }
        if ((!current.contactName || !current.contactEmail) && contactDraft.firstName && contactDraft.email) {
          const result = await requestJson<CheckoutMutationResult>("/checkout/sessions/" + current.id + "/contact", {
            method: "PATCH",
            body: JSON.stringify({
              contactName: (contactDraft.firstName + " " + contactDraft.lastName).trim(),
              contactEmail: contactDraft.email,
              contactPhone: contactDraft.phone || null,
            }),
          });
          current = result.session;
          if (active) updateShippingState(result.session, result.shippingOptions);
        }
        if (initialSavedAddress && !current.shippingAddress) {
          const result = await requestJson<CheckoutMutationResult>("/checkout/sessions/" + current.id + "/shipping-address", {
            method: "PATCH",
            body: JSON.stringify({ address: addressPayload(initialSavedAddress, contactDraft) }),
          });
          if (active) {
            updateShippingState(result.session, result.shippingOptions);
            resetDeliverySelection();
            setAddressDraft(addressFromSaved(initialSavedAddress));
          }
        }
      } catch (cause) {
        if (active) setError(errorMessage(cause, "No pudimos cargar tus datos guardados."));
      } finally {
        if (active) setAccountPrefilling(false);
      }
    })();
    return () => {
      active = false;
      accountPrefillRef.current = false;
    };
    // Runs once against the initial checkout bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveContact() {
    if (!session || busy) return;
    const fullName = (contactDraft.firstName + " " + contactDraft.lastName).trim();
    if (!contactDraft.firstName.trim() || !contactDraft.lastName.trim() || !contactDraft.phone.trim() || !contactDraft.email.trim()) {
      setError("Completá nombre, apellido, teléfono y correo para continuar.");
      return;
    }
    if (!isValidPhone(contactDraft.phone)) {
      setError("Ingresá un teléfono válido, con código de área y entre 8 y 15 números.");
      return;
    }
    if (!isValidEmail(contactDraft.email)) {
      setError("Ingresá un correo electrónico válido, por ejemplo nombre@correo.com.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await requestJson<CheckoutMutationResult>("/checkout/sessions/" + session.id + "/contact", {
        method: "PATCH",
        body: JSON.stringify({ contactName: fullName, contactEmail: contactDraft.email.trim(), contactPhone: contactDraft.phone.trim() }),
      });
      updateShippingState(result.session, result.shippingOptions);
      setEditingSection(result.session.shippingAddress ? null : "shipping");
    } catch (cause) {
      if (isConflict(cause)) recoverConflict(cause);
      setError(errorMessage(cause, "No pudimos guardar tus datos."));
    } finally {
      setLoading(false);
    }
  }

  async function saveAddress() {
    if (!session || busy) return;
    if (!contactDraft.firstName.trim() || !contactDraft.lastName.trim()) {
      setError("Completá nombre y apellido para identificar a quien recibe el pedido.");
      return;
    }
    if (!isCompleteAddress(addressDraft)) {
      setError(incompleteAddressMessage(addressDraft));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (saveAddressForLater && initialViewer?.authenticated) {
        const input: CustomerAddressInput = {
          label: addressDraft.label.trim() || "Casa",
          recipientName: (contactDraft.firstName + " " + contactDraft.lastName).trim(),
          phone: contactDraft.phone.trim() || null,
          street: addressDraft.street.trim(),
          number: addressDraft.number.trim(),
          apartment: apartmentPayload(addressDraft) || null,
          neighborhood: addressDraft.neighborhood.trim() || null,
          city: addressDraft.city.trim(),
          province: addressDraft.province.trim(),
          postalCode: addressDraft.postalCode.trim(),
          reference: addressDraft.reference.trim() || null,
        };
        const saved = await requestJson<CustomerAddress>(editingAddressId ? "/me/addresses/" + editingAddressId : "/me/addresses", {
          method: editingAddressId ? "PATCH" : "POST",
          body: JSON.stringify(input),
        });
        setSavedAddressList((current) =>
          editingAddressId ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current],
        );
        setEditingAddressId(saved.id);
      }
      const result = await requestJson<CheckoutMutationResult>("/checkout/sessions/" + session.id + "/shipping-address", {
        method: "PATCH",
        body: JSON.stringify({ address: addressPayload(addressDraft, contactDraft) }),
      });
      updateShippingState(result.session, result.shippingOptions);
      resetDeliverySelection();
      setEditingSection(null);
    } catch (cause) {
      if (isConflict(cause)) recoverConflict(cause);
      setError(errorMessage(cause, "No pudimos guardar la dirección."));
    } finally {
      setLoading(false);
    }
  }

  async function selectSavedAddress(saved: CustomerAddress) {
    if (!session || busy) return;
    const selectedAddress = addressFromSaved(saved);
    setAddressDraft(selectedAddress);
    setEditingAddressId(saved.id);
    setSaveAddressForLater(false);
    setError(null);
    if (!isCompleteAddress(selectedAddress)) {
      setAddressEditorMode("details");
      setEditingSection("shipping");
      window.requestAnimationFrame(() => floorInputRef.current?.focus());
      return;
    }
    setLoading(true);
    try {
      const result = await requestJson<CheckoutMutationResult>("/checkout/sessions/" + session.id + "/shipping-address", {
        method: "PATCH",
        body: JSON.stringify({ address: addressPayload(selectedAddress, contactDraft) }),
      });
      updateShippingState(result.session, result.shippingOptions);
      resetDeliverySelection();
      setEditingSection(null);
    } catch (cause) {
      if (isConflict(cause)) recoverConflict(cause);
      setError(errorMessage(cause, "No pudimos usar esta dirección."));
    } finally {
      setLoading(false);
    }
  }

  async function selectDeliverySlot(slot: DeliverySlot) {
    if (!session || busy || !selectedShippingOption || slotKey(slot) === selectedDeliverySlotId) return;
    setShippingSelectionLoading(true);
    setLoading(true);
    setError(null);
    try {
      const result = await requestJson<CheckoutMutationResult>("/checkout/sessions/" + session.id + "/shipping-option", {
        method: "PATCH",
        body: JSON.stringify({ shippingOptionId: selectedShippingOption, deliverySlotId: slot.id, deliveryDate: slot.date }),
      });
      updateShippingState(result.session, result.shippingOptions);
      setPaymentStepRevealed(true);
    } catch (cause) {
      if (isConflict(cause)) recoverConflict(cause);
      setError(errorMessage(cause, "No pudimos actualizar el horario de entrega."));
    } finally {
      setLoading(false);
      setShippingSelectionLoading(false);
    }
  }

  async function selectShippingOption(shippingOptionId: string) {
    if (!session || busy || shippingOptionId === selectedShippingOption) return;
    const option = shippingOptions.find((item) => item.id === shippingOptionId);
    if (!option) {
      setError("No encontramos esa opción de envío. Volvé a intentarlo.");
      return;
    }
    if (!option.available || !option.deliverySlots.length) {
      setError("No hay una franja de entrega disponible para esta opción.");
      return;
    }
    setSelectedShippingOption(shippingOptionId);
    setDeliverySlots(option.deliverySlots);
    setSelectedDeliverySlotId("");
    setError(null);
  }

  async function applyCoupon() {
    if (!session || busy || !couponCode.trim()) return;
    setCouponLoading(true);
    setError(null);
    try {
      const result = await requestJson<CheckoutMutationResult>("/checkout/sessions/" + session.id + "/coupon", {
        method: "POST",
        body: JSON.stringify({ code: couponCode.trim() }),
      });
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
    if (!session || busy) return;
    setCouponLoading(true);
    setError(null);
    try {
      const result = await requestJson<CheckoutMutationResult>("/checkout/sessions/" + session.id + "/coupon", { method: "DELETE" });
      updateShippingState(result.session, result.shippingOptions);
      setCouponCode("");
    } catch (cause) {
      if (isConflict(cause)) recoverConflict(cause);
      setError(errorMessage(cause, "No pudimos quitar el cupón."));
    } finally {
      setCouponLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || sessionInvalid || submittingRef.current) return;
    if (editingSection === "contact") return saveContact();
    if (editingSection === "shipping") return saveAddress();
    if (!session) {
      setError("Estamos recuperando la sesión del checkout. Esperá un momento e intentá nuevamente.");
      return;
    }
    if (!session.contactName || !session.contactEmail || !session.contactPhone) {
      setError("Completá tu información personal antes de continuar.");
      setEditingSection("contact");
      return;
    }
    if (!session.shippingAddress || !isCompleteAddress(addressFromCheckout(session.shippingAddress))) {
      setError("Completá y guardá la dirección de entrega para continuar.");
      setEditingSection("shipping");
      return;
    }
    if (!selectedShippingOption) {
      setError(
        shippingOptions.length ? "Elegí una opción de envío para continuar." : "No hay métodos de envío disponibles para este pedido.",
      );
      return;
    }
    if (!selectedDeliverySlotId) {
      setError(
        deliverySlots.length
          ? "Elegí un horario de entrega para continuar."
          : "No hay una franja de entrega disponible para esta dirección.",
      );
      return;
    }
    const selectedDeliverySlot = deliverySlots.find((slot) => slotKey(slot) === selectedDeliverySlotId);
    if (!selectedDeliverySlot) {
      setError("La fecha de entrega seleccionada ya no está disponible. Elegí otra.");
      return;
    }
    if (!selectedPaymentMethod) {
      setError("El pago online no está disponible en este momento. Intentá nuevamente más tarde.");
      return;
    }
    if (!termsAccepted) {
      setError("Aceptá los términos y condiciones para continuar.");
      return;
    }
    if (anonymousCheckout && isTurnstileConfigured && !turnstileToken) {
      setError("Completá la verificación de seguridad para continuar.");
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    setPaymentState(selectedPaymentMethod === "PAYWAY" ? "tokenizing" : "creating-order");
    setError(null);
    let redirecting = false;
    try {
      let current = session;
      if (
        current.shippingOptionId !== selectedShippingOption ||
        current.shippingDeliverySlot !== selectedDeliverySlot.id ||
        !sameDeliveryDate(selectedDeliverySlot.date, current.shippingDeliveryDate)
      ) {
        const result = await requestJson<CheckoutMutationResult>("/checkout/sessions/" + session.id + "/shipping-option", {
          method: "PATCH",
          body: JSON.stringify({
            shippingOptionId: selectedShippingOption,
            deliverySlotId: selectedDeliverySlot.id,
            deliveryDate: selectedDeliverySlot.date,
          }),
        });
        current = result.session;
        updateShippingState(result.session, result.shippingOptions);
      }
      if (current.paymentMethod !== selectedPaymentMethod) {
        const result = await requestJson<CheckoutMutationResult>("/checkout/sessions/" + session.id + "/payment-method", {
          method: "PATCH",
          body: JSON.stringify({ paymentMethod: selectedPaymentMethod }),
        });
        current = result.session;
        updateShippingState(result.session, result.shippingOptions);
      }
      const paywayPayment =
        selectedPaymentMethod === "PAYWAY" ? await tokenizePaywayCard(formRef.current, paywaySdkRef.current) : undefined;
      setPaymentState("creating-order");
      let storage: Storage | undefined;
      try {
        storage = window.sessionStorage;
      } catch {
        /* Keep the attempt in memory. */
      }
      const idempotencyKey = idempotencyKeyRef.current ?? checkoutAttemptKey(session.id, storage);
      idempotencyKeyRef.current = idempotencyKey;
      const result = await requestJson<CheckoutConfirmResult>("/checkout/sessions/" + session.id + "/confirm", {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
          ...(turnstileToken ? { "X-Turnstile-Token": turnstileToken } : {}),
        },
        body: JSON.stringify(paywayPayment ? { payment: paywayPayment } : {}),
      });
      if (!result.payment) {
        router.replace("/checkout/resultado");
        return;
      }
      if (result.payment.action === "REDIRECT") {
        const paymentUrl = paymentRedirectUrl(result.payment);
        if (!paymentUrl)
          throw Object.assign(new Error("La plataforma de pago no devolvió una URL válida."), { code: "PAYMENT_PROVIDER_UNAVAILABLE" });
        setPaymentState("redirecting");
        redirecting = true;
        window.location.assign(paymentUrl);
      } else router.replace("/checkout/resultado");
    } catch (cause) {
      if (anonymousCheckout) {
        setTurnstileToken(null);
        setTurnstileResetKey((current) => current + 1);
      }
      if (isIdempotencyConflict(cause))
        setError("Este intento ya fue procesado. Revisá el estado del pedido antes de volver a intentarlo.");
      else {
        // Keep the same key after a lost response: the API may have created the order.
        if (isConflict(cause)) recoverConflict(cause);
        setError(paymentErrorMessage(cause));
      }
    } finally {
      if (!redirecting) {
        submittingRef.current = false;
        setLoading(false);
        setPaymentState("idle");
      }
    }
  }

  async function configurePurchaseSchedule(enabled: boolean, frequencyDays = scheduleFrequency) {
    if (busy) return;
    if (!session || !initialViewer?.authenticated) {
      setError("Iniciá sesión para activar una compra programada.");
      return;
    }
    setScheduleLoading(true);
    setError(null);
    try {
      await requestJson("/checkout/sessions/" + session.id + "/purchase-schedule", {
        method: "POST",
        body: JSON.stringify({ enabled, frequencyDays }),
      });
      const refreshedScreen = await requestJson<CheckoutMutationResult>("/checkout/sessions/" + session.id + "/bootstrap");
      const refreshed = refreshedScreen.session;
      updateShippingState(refreshed, refreshedScreen.shippingOptions);
      if (refreshed.scheduledPurchase) setScheduleFrequency(refreshed.scheduledPurchase.frequencyDays as 7 | 14 | 21 | 30);
    } catch (cause) {
      setError(errorMessage(cause, "No pudimos actualizar la compra programada."));
    } finally {
      setScheduleLoading(false);
    }
  }

  const checkoutItems = session?.items ?? items;
  if (session?.status === "COMPLETED" && session.orderId)
    return (
      <section className="rounded-xl bg-white p-6 sm:p-10">
        <h2 className="text-2xl font-semibold">Tu pedido ya fue creado</h2>
        <p className="mt-3 text-muted">
          Consultá su estado antes de iniciar otra compra. Si el pago sigue pendiente, vas a poder revisarlo desde el pedido.
        </p>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-[#8d2020]">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={loading}
          className="mt-5 min-h-12 rounded-lg bg-brand-blue px-5 font-semibold text-white disabled:opacity-50"
          onClick={() => {
            if (submittingRef.current) return;
            submittingRef.current = true;
            setLoading(true);
            setError(null);
            let storage: Storage | undefined;
            try {
              storage = window.sessionStorage;
            } catch {
              /* In-memory fallback. */
            }
            const key = idempotencyKeyRef.current ?? checkoutAttemptKey(session.id, storage);
            idempotencyKeyRef.current = key;
            void requestJson<CheckoutConfirmResult>(`/checkout/sessions/${session.id}/confirm`, {
              method: "POST",
              headers: { "Idempotency-Key": key },
              body: "{}",
            })
              .then(() => router.replace(`/checkout/resultado?orderId=${encodeURIComponent(session.orderId!)}`))
              .catch((cause) => setError(paymentErrorMessage(cause)))
              .finally(() => {
                submittingRef.current = false;
                setLoading(false);
              });
          }}
        >
          {loading ? "Recuperando pedido…" : "Consultar mi pedido"}
        </button>
      </section>
    );
  if (!checkoutItems.length) return <EmptyCheckout />;
  if (!session) return <MissingCheckoutSession />;
  const visibleOptions = shippingOptions;
  const selectedOption = visibleOptions.find((option) => option.id === selectedShippingOption) ?? null;
  const selectedDeliverySlot = deliverySlots.find((slot) => slotKey(slot) === selectedDeliverySlotId) ?? null;
  const featuredDeliverySlot = deliverySlots[0] ?? null;
  const alternateDeliverySlots = deliverySlots.slice(1);
  const selectedAlternateDeliverySlotId =
    selectedDeliverySlot && featuredDeliverySlot && slotKey(selectedDeliverySlot) !== slotKey(featuredDeliverySlot)
      ? selectedDeliverySlotId
      : "";
  const paymentAvailable = Boolean(selectablePaymentMethods.length && selectedPaymentMethod);
  const paywayUiStatus =
    selectedPaymentMethod === "PAYWAY" && !paywayPublicApiKey
      ? "missing-config"
      : selectedPaymentMethod === "PAYWAY" && paywaySdkStatus === "idle"
        ? "loading"
        : paywaySdkStatus;
  const paymentConfigurationReady = selectedPaymentMethod !== "PAYWAY" || paywayUiStatus === "ready";
  const currentAddress = session.shippingAddress ? addressFromCheckout(session.shippingAddress) : addressDraft;
  const hasCompleteContactData = Boolean(
    session.contactName && isValidEmail(session.contactEmail ?? "") && isValidPhone(session.contactPhone ?? ""),
  );
  const hasCompleteShippingAddress = isCompleteAddress(currentAddress);
  const contactEditorVisible = editingSection === "contact" || !hasCompleteContactData;
  const shippingEditorVisible = editingSection === "shipping" || !hasCompleteShippingAddress;
  const deliveryStepComplete = Boolean(
    hasCompleteContactData && !shippingEditorVisible && selectedShippingOption && selectedOption?.available && selectedDeliverySlot,
  );
  const paymentStepVisible = paymentStepRevealed || deliveryStepComplete;
  const checkoutReady = Boolean(
    !sessionInvalid &&
    !editingSection &&
    session.status === "DRAFT" &&
    hasCompleteContactData &&
    hasCompleteShippingAddress &&
    selectedShippingOption &&
    selectedOption?.available &&
    selectedDeliverySlotId &&
    paymentAvailable &&
    session.paymentMethod === selectedPaymentMethod &&
    paymentConfigurationReady &&
    termsAccepted,
  );
  const purchaseScheduleAllowed = Boolean(
    !sessionInvalid &&
    initialViewer?.authenticated &&
    initialViewer.role === "CUSTOMER" &&
    session.actions?.purchaseSchedule?.allowed !== false,
  );
  const missingRequirements = [
    !hasCompleteContactData ? "tus datos personales" : null,
    !hasCompleteShippingAddress ? "una dirección de entrega" : null,
    !selectedShippingOption || !selectedOption?.available ? "una opción de envío" : null,
    !selectedDeliverySlotId ? "un horario de entrega" : null,
    !paymentAvailable || !paymentConfigurationReady ? "un medio de pago" : null,
    !termsAccepted ? "aceptar los términos" : null,
  ].filter((value): value is string => Boolean(value));

  const cancelEditing = () => {
    setError(null);
    setContactDraft(contactFromData(session, initialCustomer, initialViewer, savedAddressList[0] ?? null));
    setAddressDraft(session.shippingAddress ? addressFromCheckout(session.shippingAddress) : initialAddress);
    setEditingSection(null);
  };
  const editShipping = () => {
    setError(null);
    setAddressDraft(session.shippingAddress ? addressFromCheckout(session.shippingAddress) : addressDraft);
    setAddressEditorMode("details");
    setEditingSection("shipping");
  };
  const chooseShippingAddress = () => {
    setError(null);
    setAddressEditorMode("choose");
    setEditingSection("shipping");
  };
  const createShippingAddress = () => {
    setError(null);
    setAddressDraft(emptyAddress());
    setEditingAddressId(null);
    setSaveAddressForLater(false);
    setAddressEditorMode("new");
    setEditingSection("shipping");
  };
  const applyGoogleAddress = (selection: GoogleAddressSelection) => {
    if (busy) return;
    setEditingAddressId(null);
    setSaveAddressForLater(false);
    setAddressEditorMode("details");
    setAddressDraft((current) => ({
      ...current,
      street: selection.street ?? "",
      number: selection.number ?? "",
      floor: "",
      department: selection.apartment ?? "",
      neighborhood: selection.neighborhood ?? "",
      city: selection.city ?? "",
      province: selection.province ?? "",
      postalCode: selection.postalCode ?? "",
      reference: "",
    }));
    window.requestAnimationFrame(() => floorInputRef.current?.focus());
  };

  return (
    <form ref={formRef} onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
      <div className="space-y-3 lg:hidden">
        <div
          className="flex items-center justify-between rounded-2xl border border-brand-blue/15 bg-white px-4 py-3 shadow-[0_4px_12px_rgba(24,33,43,0.05)]"
          aria-live="polite"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
              {session.shippingOptionId && selectedDeliverySlot ? "Total a pagar" : "Total parcial"}
            </p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums text-ink">{formatMoney(Number(session.total))}</p>
          </div>
          <div className="text-right text-xs text-muted">
            <p>{productCountLabel(checkoutItems.reduce((total, item) => total + item.quantity, 0))}</p>
            <p className="mt-0.5">
              {selectedDeliverySlot ? (formatDeliveryDate(selectedDeliverySlot.date) ?? "Entrega a confirmar") : "Entrega a confirmar"}
            </p>
          </div>
        </div>
      </div>
      {sessionInvalid ? (
        <div
          ref={sessionAlertRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-[#e4a5a5] bg-[#fff1f1] p-4 outline-none lg:col-span-2"
        >
          <p className="font-semibold text-[#8d2020]">La sesión de compra expiró</p>
          <p className="mt-1 text-sm text-[#8d2020]">
            Tu carrito sigue disponible. Volvé al carrito para recalcular envío y total antes de pagar.
          </p>
          <Link
            href="/carrito?checkoutError=checkout-expired"
            className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white"
          >
            Volver al carrito
          </Link>
        </div>
      ) : null}
      <fieldset disabled={busy || sessionInvalid} className="min-w-0 rounded-2xl border border-border bg-white p-4 sm:p-6">
        <div className="divide-y divide-catalog-line">
          <CheckoutSection
            title="Información personal"
            icon={<UserCircle size={20} aria-hidden="true" />}
            action={
              contactEditorVisible ? undefined : (
                <EditButton
                  onClick={() => {
                    setError(null);
                    setEditingSection("contact");
                  }}
                />
              )
            }
          >
            {contactEditorVisible ? (
              <div className="pt-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Nombre"
                    value={contactDraft.firstName}
                    onChange={(value) => setContactDraft((current) => ({ ...current, firstName: value }))}
                    autoComplete="given-name"
                  />
                  <Field
                    label="Apellido"
                    value={contactDraft.lastName}
                    onChange={(value) => setContactDraft((current) => ({ ...current, lastName: value }))}
                    autoComplete="family-name"
                  />
                  <Field
                    label="Teléfono"
                    value={contactDraft.phone}
                    onChange={(value) => setContactDraft((current) => ({ ...current, phone: value }))}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="11 1234-5678"
                  />
                  <Field
                    label="Correo electrónico"
                    value={contactDraft.email}
                    onChange={(value) => setContactDraft((current) => ({ ...current, email: value }))}
                    type="email"
                    autoComplete="email"
                  />
                </div>
                <EditorActions
                  onCancel={cancelEditing}
                  onSave={() => void saveContact()}
                  loading={loading}
                  saveLabel="Guardar datos"
                  canCancel={hasCompleteContactData}
                />
              </div>
            ) : (
              <SummaryRow
                title={session.contactName || (contactDraft.firstName + " " + contactDraft.lastName).trim() || "Faltan tus datos"}
                detail={session.contactEmail || contactDraft.email}
                extra={session.contactPhone || contactDraft.phone}
                empty={
                  !session.contactName ||
                  !isValidEmail(session.contactEmail || contactDraft.email) ||
                  !isValidPhone(session.contactPhone || contactDraft.phone)
                }
              />
            )}
          </CheckoutSection>
          {hasCompleteContactData ? (
            <CheckoutSection title="Entrega" icon={<Truck size={20} aria-hidden="true" />}>
              <div className="pt-3">
                {accountPrefilling ? <InlineStatus>Estamos cargando tu dirección guardada…</InlineStatus> : null}
                {shippingEditorVisible ? (
                  <div>
                    {addressEditorMode === "choose" ? (
                      <>
                        <fieldset>
                          <legend className="text-sm font-semibold">Elegí una dirección guardada</legend>
                          {savedAddressList.length ? (
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              {orderSavedAddresses(savedAddressList).map((saved) => {
                                const savedDraft = addressFromSaved(saved);
                                return (
                                  <button
                                    key={saved.id}
                                    type="button"
                                    onClick={() => void selectSavedAddress(saved)}
                                    disabled={busy}
                                    className="min-h-20 rounded-lg border border-catalog-line bg-catalog-canvas px-3 py-2.5 text-left transition-colors hover:border-brand-blue/40 hover:bg-soft-blue focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:cursor-wait disabled:opacity-60"
                                  >
                                    <span className="flex items-center justify-between gap-2">
                                      <span className="font-semibold text-ink">{saved.label}</span>
                                      {saved.isDefault ? (
                                        <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-xs font-semibold text-ink">
                                          Principal
                                        </span>
                                      ) : null}
                                    </span>
                                    <span className="mt-1 block text-sm text-ink">{addressTitle(savedDraft)}</span>
                                    <span className="mt-0.5 block truncate text-xs text-muted">{addressDetail(savedDraft)}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-muted">Todavía no tenés otras direcciones guardadas.</p>
                          )}
                        </fieldset>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                          {hasCompleteShippingAddress ? <CompactAction onClick={cancelEditing}>Cancelar</CompactAction> : <span />}
                          <CompactAction onClick={createShippingAddress} emphasis>
                            Agregar una dirección nueva
                          </CompactAction>
                        </div>
                      </>
                    ) : addressEditorMode === "new" ? (
                      <>
                        {savedAddressList.length ? (
                          <CompactAction onClick={chooseShippingAddress}>Elegir una dirección guardada</CompactAction>
                        ) : null}
                        <div className={savedAddressList.length ? "mt-3" : undefined}>
                          <GoogleAddressAutocomplete onSelect={applyGoogleAddress} manualFallbackAvailable={false} />
                        </div>
                        {hasCompleteShippingAddress ? (
                          <div className="mt-3">
                            <CompactAction onClick={cancelEditing}>Cancelar</CompactAction>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <p className="mb-3 text-sm text-muted">
                          Editando <strong className="font-semibold text-ink">{addressTitle(addressDraft)}</strong>
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            label="Piso"
                            value={addressDraft.floor}
                            onChange={(value) => setAddressDraft((current) => ({ ...current, floor: value }))}
                            inputRef={floorInputRef}
                            autoComplete="address-line2"
                            placeholder="Ej. 4"
                            maxLength={20}
                          />
                          <Field
                            label="Departamento"
                            value={addressDraft.department}
                            onChange={(value) => setAddressDraft((current) => ({ ...current, department: value }))}
                            autoComplete="address-line2"
                            placeholder="Ej. B"
                            maxLength={40}
                          />
                          <Field
                            label="Referencia"
                            value={addressDraft.reference}
                            onChange={(value) => setAddressDraft((current) => ({ ...current, reference: value }))}
                            required={false}
                            placeholder="Ej. portón negro"
                            maxLength={240}
                            className="sm:col-span-2"
                          />
                        </div>
                        {initialViewer?.authenticated ? (
                          <div className="mt-4 flex items-start gap-3">
                            <input
                              id="save-address"
                              type="checkbox"
                              checked={saveAddressForLater}
                              onChange={(event) => setSaveAddressForLater(event.target.checked)}
                              className="mt-1 size-4 accent-brand-blue"
                            />
                            <label htmlFor="save-address" className="text-sm text-muted">
                              {editingAddressId
                                ? "Actualizar también esta dirección en mi cuenta"
                                : "Guardar esta dirección para futuras compras"}
                            </label>
                          </div>
                        ) : null}
                        <EditorActions
                          onCancel={cancelEditing}
                          onSave={() => void saveAddress()}
                          loading={loading}
                          saveLabel="Usar esta dirección"
                          disabled={!isCompleteAddress(addressDraft)}
                          canCancel={hasCompleteShippingAddress}
                        />
                      </>
                    )}
                  </div>
                ) : null}
                {!shippingEditorVisible && (
                  <div className="mt-3 rounded-lg border border-brand-blue/20 bg-soft-blue p-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle size={19} weight="fill" className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{addressTitle(currentAddress)}</p>
                        <p className="mt-0.5 text-sm text-muted">{addressDetail(currentAddress)}</p>
                        {currentAddress.reference ? <p className="mt-0.5 text-sm text-muted">Ref.: {currentAddress.reference}</p> : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-brand-blue/10 pt-2">
                      <CompactAction onClick={editShipping}>Editar dirección</CompactAction>
                      {savedAddressList.length ? <CompactAction onClick={chooseShippingAddress}>Elegir guardada</CompactAction> : null}
                      <CompactAction onClick={createShippingAddress}>Agregar nueva</CompactAction>
                    </div>
                  </div>
                )}
                {!shippingEditorVisible &&
                  (hasCompleteShippingAddress ? (
                    visibleOptions.length ? (
                      <div className="mt-4">
                        <fieldset>
                          <legend className="text-sm font-semibold">Elegí una opción de envío</legend>
                          <div className="mt-2 grid gap-2">
                            {visibleOptions.map((option) => (
                              <label
                                key={option.id}
                                className={
                                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors " +
                                  (selectedShippingOption === option.id
                                    ? "border-brand-blue bg-soft-blue"
                                    : "border-transparent bg-catalog-canvas hover:border-brand-blue/40 hover:bg-soft-blue")
                                }
                              >
                                <input
                                  type="radio"
                                  name="shippingOption"
                                  value={option.id}
                                  checked={selectedShippingOption === option.id}
                                  onChange={() => void selectShippingOption(option.id)}
                                  disabled={busy || !option.available}
                                  className="accent-brand-blue"
                                />
                                <span className="min-w-0 flex-1 text-sm font-semibold">Entrega a domicilio</span>
                                <ShippingPriceLabel option={option} />
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        {selectedOption && !selectedOption.available ? (
                          <InlineStatus tone="error">{selectedOption.message}</InlineStatus>
                        ) : featuredDeliverySlot ? (
                          <fieldset className="mt-4">
                            <legend className="text-sm font-semibold">¿Cuándo querés recibirlo?</legend>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <label
                                className={
                                  "flex min-h-20 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-within:border-brand-blue " +
                                  (selectedDeliverySlotId === slotKey(featuredDeliverySlot)
                                    ? "border-brand-blue bg-soft-blue"
                                    : "border-catalog-line bg-catalog-canvas hover:border-brand-blue hover:bg-soft-blue")
                                }
                              >
                                <input
                                  type="radio"
                                  name="deliverySlot"
                                  value={slotKey(featuredDeliverySlot)}
                                  checked={selectedDeliverySlotId === slotKey(featuredDeliverySlot)}
                                  onChange={() => void selectDeliverySlot(featuredDeliverySlot)}
                                  disabled={loading}
                                  className="sr-only"
                                />
                                <DeliverySelectionMark selected={selectedDeliverySlotId === slotKey(featuredDeliverySlot)} />
                                <span className="min-w-0 flex-1">
                                  <span className="block font-semibold">{deliveryChoiceTitle(featuredDeliverySlot.date)}</span>
                                  <span className="mt-0.5 block text-sm text-muted">
                                    {formatDeliveryDate(featuredDeliverySlot.date) ?? "Fecha a confirmar"} · {featuredDeliverySlot.label}
                                  </span>
                                </span>
                                {selectedOption ? <ShippingPriceLabel option={selectedOption} /> : null}
                              </label>
                              {alternateDeliverySlots.length ? (
                                <AlternateDeliveryMenu
                                  slots={alternateDeliverySlots}
                                  selectedSlotId={selectedAlternateDeliverySlotId}
                                  option={selectedOption}
                                  loading={loading}
                                  onSelect={(slot) => void selectDeliverySlot(slot)}
                                />
                              ) : null}
                            </div>
                            {shippingSelectionLoading ? (
                              <p className="mt-2 text-xs text-muted" role="status">
                                Guardando tu horario de entrega…
                              </p>
                            ) : null}
                          </fieldset>
                        ) : (
                          <InlineStatus icon={<Clock size={17} aria-hidden="true" />}>
                            No hay franjas disponibles para esta dirección.
                          </InlineStatus>
                        )}
                      </div>
                    ) : (
                      <InlineStatus tone="error">No podemos entregar en esta dirección.</InlineStatus>
                    )
                  ) : (
                    <InlineStatus icon={<MapPin size={17} aria-hidden="true" />}>
                      Buscá y seleccioná una dirección para consultar cobertura y fechas de entrega.
                    </InlineStatus>
                  ))}
                {!shippingEditorVisible &&
                selectedOption?.available &&
                Number(selectedOption.cost) > 0 &&
                selectedOption.remainingForFreeShipping &&
                Number(selectedOption.remainingForFreeShipping) > 0 ? (
                  <p className="mt-3 text-xs text-muted">
                    Te faltan {formatMoney(Number(selectedOption.remainingForFreeShipping))} en productos elegibles para el envío gratis a
                    esta dirección.
                  </p>
                ) : null}
              </div>
            </CheckoutSection>
          ) : null}
          {paymentStepVisible ? (
            <CheckoutSection title="Método de pago" icon={<CreditCard size={20} aria-hidden="true" />}>
              <div className="pt-4">
                {selectablePaymentMethods.length ? (
                  <div className="grid gap-2">
                    {selectablePaymentMethods.map((method) => (
                      <label
                        key={method.paymentMethod}
                        className={
                          "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors " +
                          (selectedPaymentMethod === method.paymentMethod ? "bg-soft-blue" : "bg-catalog-canvas hover:bg-soft-blue")
                        }
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center text-brand-blue">
                          <PaymentMethodIcon method={method.paymentMethod} />
                        </span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.paymentMethod}
                          checked={selectedPaymentMethod === method.paymentMethod}
                          onChange={() => setSelectedPaymentMethod(method.paymentMethod)}
                          className="sr-only"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{paymentMethodLabel(method.paymentMethod)}</span>
                          <span className="mt-0.5 block text-xs text-muted">
                            {method.benefit?.description ?? paymentMethodDescription(method.paymentMethod)}
                          </span>
                        </span>
                        {selectedPaymentMethod === method.paymentMethod ? (
                          <CheckCircle size={19} weight="fill" className="shrink-0 text-brand-blue" aria-label="Seleccionado" />
                        ) : null}
                      </label>
                    ))}
                  </div>
                ) : (
                  <InlineStatus tone="error">No hay un medio de pago disponible en este momento.</InlineStatus>
                )}
                {selectedPaymentMethod === "PAYWAY" ? <DebitCardForm sdkStatus={paywayUiStatus} /> : null}
              </div>
            </CheckoutSection>
          ) : null}
          {paymentStepVisible && purchaseScheduleAllowed ? (
            <CheckoutSection title="Compra programada" icon={<CalendarBlank size={20} aria-hidden="true" />}>
              <div className="pt-4">
                <label className="flex items-start gap-3 rounded-lg border border-catalog-line p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(session.scheduledPurchase)}
                    onChange={(event) => void configurePurchaseSchedule(event.target.checked)}
                    disabled={scheduleLoading}
                    className="mt-1 size-4 accent-brand-blue"
                  />
                  <span>
                    <span className="block text-sm font-semibold">Recibir este alimento cada cierto tiempo</span>
                    <span className="mt-1 block text-sm text-muted">
                      La primera compra se procesa ahora. Para las siguientes te enviaremos un aviso y vos confirmás el carrito.
                    </span>
                  </span>
                </label>
                {session.scheduledPurchase ? (
                  <label className="mt-3 block text-sm font-semibold">
                    Frecuencia
                    <select
                      value={scheduleFrequency}
                      onChange={(event) => {
                        const value = Number(event.target.value) as 7 | 14 | 21 | 30;
                        setScheduleFrequency(value);
                        void configurePurchaseSchedule(true, value);
                      }}
                      disabled={scheduleLoading}
                      className="mt-2 h-11 w-full rounded-lg border border-catalog-line bg-white px-3 font-normal"
                    >
                      <option value={7}>Cada 7 días</option>
                      <option value={14}>Cada 14 días</option>
                      <option value={21}>Cada 21 días</option>
                      <option value={30}>Cada 30 días</option>
                    </select>
                  </label>
                ) : null}
                <p className="mt-3 text-xs text-muted">
                  {session.scheduledPurchase
                    ? `Descuento programado: ${formatPercentage(session.scheduledPurchase.discountPercent)}.`
                    : "Podés activar el recordatorio antes de pagar."}
                </p>
              </div>
            </CheckoutSection>
          ) : null}
        </div>
        <div className="mt-5 border-t border-catalog-line pt-5">
          {session.pricing?.conflicts.map((conflict) => (
            <p key={conflict.code} role="alert" className="mb-3 rounded-lg bg-[#fff8e8] p-3 text-sm text-[#6f5312]">
              {conflict.message}
            </p>
          ))}
          {paymentStepVisible ? (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <Tag size={17} className="text-brand-blue" aria-hidden="true" />
                  ¿Tenés un cupón?
                </span>
                <span className="text-muted transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="mt-3 flex gap-2">
                <input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  aria-label="Código de cupón"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void applyCoupon();
                    }
                  }}
                  placeholder="Código"
                  maxLength={64}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-catalog-line bg-white px-3 uppercase focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                  disabled={Boolean(session.couponCode) || couponLoading || session.actions?.coupon.allowed === false}
                />
                <button
                  type="button"
                  onClick={() => void applyCoupon()}
                  disabled={!couponCode.trim() || Boolean(session.couponCode) || couponLoading || session.actions?.coupon.allowed === false}
                  className="min-h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Aplicar
                </button>
              </div>
              {session.actions?.coupon.allowed === false && session.actions.coupon.message ? (
                <p className="mt-2 text-xs text-muted">{session.actions.coupon.message}</p>
              ) : null}
              {session.couponCode ? (
                <p className="mt-2 flex items-center justify-between gap-3 text-sm text-muted">
                  <span>
                    Cupón aplicado: <strong className="text-ink">{session.couponCode}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => void clearCoupon()}
                    disabled={couponLoading}
                    className="font-semibold text-brand-blue hover:underline"
                  >
                    Quitar
                  </button>
                </p>
              ) : null}
            </details>
          ) : null}
          <div className="mt-5 lg:hidden">
            <CheckoutSummary session={session} items={checkoutItems} deliverySlot={selectedDeliverySlot} pets={pets} />
          </div>
          {paymentStepVisible ? (
            <>
              {anonymousCheckout ? (
                <div className="mt-5">
                  <TurnstileWidget action="anonymous-checkout" resetKey={turnstileResetKey} onToken={setTurnstileToken} />
                </div>
              ) : null}
              <label className="mt-5 flex items-start gap-3 text-sm leading-5 text-muted">
                <input
                  name="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  className="mt-0.5 size-4 accent-brand-blue"
                />
                <span>
                  Acepto los{" "}
                  <Link href="/terminos" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-blue underline">
                    términos y condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacidad" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-blue underline">
                    política de privacidad
                  </Link>
                  .
                </span>
              </label>
              {paymentState !== "idle" ? (
                <InlineStatus icon={<Wallet size={17} aria-hidden="true" />} tone="muted">
                  {paymentState === "tokenizing"
                    ? "Validando los datos de tu tarjeta…"
                    : paymentState === "redirecting"
                      ? "Redirigiendo a Mercado Pago…"
                      : paymentState === "creating-order" && selectedPaymentMethod === "PAYWAY"
                        ? "Enviando el pago…"
                        : "Conectando con Mercado Pago…"}
                </InlineStatus>
              ) : null}
              {!checkoutReady && !busy && !sessionInvalid && missingRequirements.length ? (
                <p id="checkout-requirements" className="mt-4 rounded-lg bg-catalog-canvas p-3 text-sm text-muted" role="status">
                  Para continuar, completá {joinSpanish(missingRequirements)}.
                </p>
              ) : null}
            </>
          ) : null}
          {error ? (
            <p role="alert" className="mt-4 rounded-lg bg-[#fff1f1] p-3 text-sm text-[#8d2020]">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/carrito"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted hover:bg-catalog-canvas hover:text-ink"
            >
              <X size={17} aria-hidden="true" />
              Volver al carrito
            </Link>
            {paymentStepVisible ? (
              <button
                type="submit"
                disabled={busy || !checkoutReady}
                aria-describedby={!checkoutReady && missingRequirements.length ? "checkout-requirements" : undefined}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-[#0048dc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <span>{busy ? (paymentState === "redirecting" ? "Redirigiendo…" : "Actualizando…") : "Pagar con Mercado Pago"}</span>
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </fieldset>
      <div className="hidden lg:sticky lg:top-6 lg:block">
        <CheckoutSummary session={session} items={checkoutItems} deliverySlot={selectedDeliverySlot} pets={pets} />
      </div>
    </form>
  );
}

function CheckoutSection({ title, icon, action, children }: { title: string; icon: ReactNode; action?: ReactNode; children: ReactNode }) {
  const headingId = "checkout-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <section className="py-5 first:pt-0 last:pb-0" aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="flex items-center gap-2 text-base font-semibold text-ink">
          <span className="text-brand-blue">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function PaymentMethodIcon({ method }: { method: AvailablePaymentMethod["paymentMethod"] }) {
  if (method === "MERCADO_PAGO") {
    return <Image src="/brand/payments/mercado-pago.svg" alt="" width={28} height={28} className="size-7 object-contain" />;
  }
  return method === "BANK_TRANSFER" ? <Wallet size={21} aria-hidden="true" /> : <CreditCard size={21} aria-hidden="true" />;
}

function DebitCardForm({ sdkStatus }: { sdkStatus: "idle" | "loading" | "ready" | "missing-config" | "error" }) {
  return (
    <div className="mt-3 min-h-[248px] rounded-xl bg-catalog-canvas p-4" aria-label="Datos de tarjeta de débito">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">Datos de la tarjeta</p>
        <span className="flex items-center gap-1 text-xs text-muted">
          <LockKey size={14} className="text-brand-blue" aria-hidden="true" />
          Pago seguro
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold sm:col-span-2">
          Número de tarjeta
          <input
            name="payway-card-number"
            data-decidir="card_number"
            required
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            className="mt-1.5 h-11 w-full rounded-lg border border-catalog-line bg-white px-3 font-normal placeholder:text-muted/70 focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          />
        </label>
        <label className="text-sm font-semibold">
          Vencimiento
          <input
            name="payway-expiration-month"
            data-decidir="card_expiration_month"
            required
            inputMode="numeric"
            autoComplete="cc-exp-month"
            placeholder="MM"
            maxLength={2}
            className="mt-1.5 h-11 w-full rounded-lg border border-catalog-line bg-white px-3 font-normal placeholder:text-muted/70 focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          />
        </label>
        <label className="text-sm font-semibold">
          Año
          <input
            name="payway-expiration-year"
            data-decidir="card_expiration_year"
            required
            inputMode="numeric"
            autoComplete="cc-exp-year"
            placeholder="AA"
            maxLength={2}
            className="mt-1.5 h-11 w-full rounded-lg border border-catalog-line bg-white px-3 font-normal placeholder:text-muted/70 focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Nombre del titular
          <input
            name="payway-card-holder"
            data-decidir="card_holder_name"
            required
            autoComplete="cc-name"
            placeholder="Como figura en la tarjeta"
            className="mt-1.5 h-11 w-full rounded-lg border border-catalog-line bg-white px-3 font-normal placeholder:text-muted/70 focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          />
        </label>
        <label className="text-sm font-semibold">
          Documento
          <select
            name="payway-card-holder-doc-type"
            data-decidir="card_holder_doc_type"
            defaultValue="dni"
            required
            className="mt-1.5 h-11 w-full rounded-lg border border-catalog-line bg-white px-3 font-normal focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            <option value="dni">DNI</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Número de DNI
          <input
            name="payway-card-holder-doc-number"
            data-decidir="card_holder_doc_number"
            required
            inputMode="numeric"
            autoComplete="off"
            placeholder="Sin puntos"
            maxLength={10}
            className="mt-1.5 h-11 w-full rounded-lg border border-catalog-line bg-white px-3 font-normal placeholder:text-muted/70 focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          />
        </label>
        <label className="text-sm font-semibold">
          Código de seguridad
          <input
            name="payway-security-code"
            data-decidir="security_code"
            required
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="CVV"
            maxLength={4}
            className="mt-1.5 h-11 w-full rounded-lg border border-catalog-line bg-white px-3 font-normal placeholder:text-muted/70 focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          />
        </label>
        <label className="text-sm font-semibold">
          Cuotas
          <select
            name="payway-installments"
            defaultValue="1"
            disabled
            className="mt-1.5 h-11 w-full rounded-lg border border-catalog-line bg-white px-3 font-normal focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            <option value="1">1 cuota</option>
          </select>
        </label>
      </div>
      {sdkStatus === "loading" ? (
        <p className="mt-3 text-xs text-muted" role="status">
          Preparando el pago seguro…
        </p>
      ) : null}
      {sdkStatus === "missing-config" ? (
        <p className="mt-3 text-xs text-[#8d2020]" role="alert">
          El pago con tarjeta todavía no está configurado.
        </p>
      ) : null}
      {sdkStatus === "error" ? (
        <p className="mt-3 text-xs text-[#8d2020]" role="alert">
          No pudimos preparar el pago con tarjeta. Intentá nuevamente.
        </p>
      ) : null}
    </div>
  );
}

function SummaryRow({ title, detail, extra, empty = false }: { title: string; detail?: string; extra?: string; empty?: boolean }) {
  return (
    <div
      className={
        "mt-3 rounded-lg border p-3 " +
        (empty ? "border-dashed border-catalog-line bg-catalog-canvas" : "border-brand-blue/20 bg-soft-blue")
      }
    >
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{title}</p>
        {detail ? <p className="mt-0.5 text-muted">{detail}</p> : null}
        {extra ? <p className="mt-0.5 text-muted">{extra}</p> : null}
      </div>
    </div>
  );
}

function CompactAction({ children, onClick, emphasis = false }: { children: ReactNode; onClick: () => void; emphasis?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue " +
        (emphasis ? "text-brand-blue hover:bg-soft-blue" : "text-muted hover:bg-catalog-canvas hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

function DeliverySelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "flex size-5 shrink-0 items-center justify-center rounded-full border " +
        (selected ? "border-brand-blue bg-brand-blue text-white" : "border-[#aeb4be] bg-white")
      }
    >
      {selected ? <Check size={13} weight="bold" /> : null}
    </span>
  );
}

function AlternateDeliveryMenu({
  slots,
  selectedSlotId,
  option,
  loading,
  onSelect,
}: {
  slots: DeliverySlot[];
  selectedSlotId: string;
  option: ShippingOption | null;
  loading: boolean;
  onSelect: (slot: DeliverySlot) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const selectedSlot = slots.find((slot) => slotKey(slot) === selectedSlotId) ?? null;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={loading}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className={
          "flex min-h-20 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:border-brand-blue focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 " +
          (selectedSlot
            ? "border-brand-blue bg-soft-blue"
            : "border-catalog-line bg-catalog-canvas hover:border-brand-blue hover:bg-soft-blue")
        }
      >
        <DeliverySelectionMark selected={Boolean(selectedSlot)} />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Elegir otro día</span>
          <span className="mt-0.5 block truncate text-sm text-muted">
            {selectedSlot
              ? `${formatDeliveryDate(selectedSlot.date) ?? "Fecha a confirmar"} · ${selectedSlot.label}`
              : `${slots.length} fechas disponibles`}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {option ? <ShippingPriceLabel option={option} /> : null}
          <CaretDown
            size={16}
            weight="bold"
            className={"text-brand-blue transition-transform duration-200 " + (open ? "rotate-180" : "")}
            aria-hidden="true"
          />
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="region"
          aria-label="Otras fechas de entrega"
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl bg-white p-1.5 shadow-[0_14px_36px_rgba(23,23,23,0.14)]"
        >
          {slots.map((slot) => {
            const selected = slotKey(slot) === selectedSlotId;
            return (
              <button
                key={slotKey(slot)}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setOpen(false);
                  onSelect(slot);
                }}
                className={
                  "flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:bg-soft-blue focus-visible:outline-none " +
                  (selected ? "bg-soft-blue" : "hover:bg-catalog-canvas")
                }
              >
                <DeliverySelectionMark selected={selected} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{formatDeliveryDate(slot.date) ?? "Fecha a confirmar"}</span>
                  <span className="mt-0.5 block text-xs text-muted">{slot.label}</span>
                </span>
                {option ? <ShippingPriceLabel option={option} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand-blue hover:bg-soft-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
    >
      <PencilSimple size={15} aria-hidden="true" />
      Editar
    </button>
  );
}

function EditorActions({
  onCancel,
  onSave,
  loading,
  saveLabel,
  disabled = false,
  canCancel = true,
}: {
  onCancel: () => void;
  onSave: () => void;
  loading: boolean;
  saveLabel: string;
  disabled?: boolean;
  canCancel?: boolean;
}) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {canCancel ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-muted hover:bg-catalog-canvas hover:text-ink"
        >
          Cancelar
        </button>
      ) : null}
      <button
        type="button"
        onClick={onSave}
        disabled={loading || disabled}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Guardando…" : saveLabel}
        <Check size={16} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputRef,
  required = true,
  className = "",
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  required?: boolean;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "onChange">) {
  return (
    <label className={"text-sm font-semibold " + className}>
      <span>
        {label}
        {required ? (
          <span className="ml-0.5 text-brand-blue" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1 font-normal text-muted">(opcional)</span>
        )}
      </span>
      <input
        {...props}
        ref={inputRef}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-lg border border-catalog-line bg-white px-3 text-base font-normal transition-colors placeholder:text-muted focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      />
    </label>
  );
}

function InlineStatus({ children, icon, tone = "muted" }: { children: ReactNode; icon?: ReactNode; tone?: "muted" | "error" }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={
        "mt-3 flex items-start gap-2 rounded-lg p-3 text-sm " +
        (tone === "error" ? "bg-[#fff1f1] text-[#8d2020]" : "bg-catalog-canvas text-muted")
      }
    >
      {icon ?? <ShieldCheck size={17} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />}
      {children}
    </p>
  );
}

function CheckoutSummary({
  session,
  items,
  deliverySlot,
  pets,
}: {
  session: CheckoutSession;
  items: CheckoutSession["items"];
  deliverySlot: DeliverySlot | null;
  pets: CustomerPet[];
}) {
  const subtotal = Number(session.subtotal);
  const hasProductAndPaymentDiscount =
    Number(session.pricing?.productDiscountTotal ?? 0) > 0 || Number(session.pricing?.paymentDiscountTotal ?? 0) > 0;
  const appliedBenefits = (session.pricing?.benefits ?? []).filter((benefit) => benefit.type !== "SHIPPING" && Number(benefit.amount) > 0);
  const shippingBenefit = session.pricing?.benefits.find((benefit) => benefit.type === "SHIPPING" && Number(benefit.amount) > 0);

  return (
    <aside className="h-fit rounded-2xl bg-white p-3 sm:p-6" aria-label="Resumen de tu compra">
      <h2 className="text-lg font-semibold">Resumen</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((item) => (
          <li key={item.variantId} className="flex justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate">
                {item.quantity} × {item.productName}
              </span>
              <span className="block text-xs text-muted">{item.presentation ?? "Presentación"}</span>
              {item.petId ? (
                <span className="mt-0.5 block text-xs font-semibold text-brand-blue">
                  Para {pets.find((pet) => pet.id === item.petId)?.name ?? "tu mascota"}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 tabular-nums">{formatMoney(Number(item.lineTotal))}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 rounded-lg bg-soft-blue p-3" aria-live="polite">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-blue">
          <Truck size={17} aria-hidden="true" />
          <span>Fecha de entrega</span>
        </div>
        {deliverySlot ? (
          <div className="mt-1.5">
            <p className="font-semibold">{formatDeliveryDate(deliverySlot.date) ?? "Fecha a confirmar"}</p>
            <p className="text-sm text-muted">Horario: {deliverySlot.label}</p>
          </div>
        ) : (
          <p className="mt-1.5 text-sm text-muted">Elegí una fecha y horario para continuar.</p>
        )}
      </div>
      <div className="mt-5 space-y-2 border-t border-catalog-line pt-5 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className={hasProductAndPaymentDiscount ? "text-muted" : "tabular-nums"}>
            {hasProductAndPaymentDiscount ? <del>{formatMoney(subtotal)}</del> : formatMoney(subtotal)}
          </span>
        </div>
        {appliedBenefits.map((benefit) => (
          <div key={`${benefit.type}:${benefit.description}`} className="flex justify-between gap-3 font-semibold text-brand-blue">
            <span>
              {benefit.description}
              {benefit.percentage ? ` (${formatPercentage(benefit.percentage)})` : ""}
            </span>
            <span className="shrink-0">-{formatMoney(Number(benefit.amount))}</span>
          </div>
        ))}
        {!appliedBenefits.length
          ? (
              [
                ["Descuentos en productos", session.pricing?.productDiscountTotal],
                ["Descuento por medio de pago", session.pricing?.paymentDiscountTotal],
              ] as const
            ).map(([label, amount]) =>
              Number(amount ?? 0) > 0 ? (
                <div key={label} className="flex justify-between gap-3 text-brand-blue">
                  <span>{label}</span>
                  <span>-{formatMoney(Number(amount))}</span>
                </div>
              ) : null,
            )
          : null}
        <div className="flex justify-between">
          <span>Envío</span>
          <span className="flex items-center gap-2 tabular-nums">
            {shippingBenefit ? <del className="text-muted">{formatMoney(Number(shippingBenefit.amount))}</del> : null}
            {!session.shippingOptionId || !deliverySlot ? (
              <span className="text-muted">A confirmar</span>
            ) : Number(session.shippingCost) > 0 ? (
              <strong className={shippingBenefit ? "text-brand-blue" : "text-ink"}>{formatMoney(Number(session.shippingCost))}</strong>
            ) : (
              <strong className="text-brand-blue">Gratis</strong>
            )}
          </span>
        </div>
        {shippingBenefit ? <p className="text-xs text-muted">{shippingBenefit.description}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-brand-blue px-4 py-3 text-white">
          <span className="font-semibold">{session.shippingOptionId && deliverySlot ? "Total a pagar" : "Total parcial"}</span>
          <strong className="text-2xl tabular-nums">{formatMoney(Number(session.total))}</strong>
        </div>
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted">
        <LockKey size={16} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
        {session.shippingOptionId && deliverySlot
          ? "Revisá el total antes de continuar al pago seguro de Mercado Pago."
          : "Confirmá tu dirección y horario para conocer el total con envío."}
      </p>
    </aside>
  );
}

function EmptyCheckout() {
  return (
    <section className="rounded-xl bg-white p-7 sm:p-10">
      <h2 className="text-xl font-semibold">Tu carrito está vacío</h2>
      <p className="mt-2 text-muted">Agregá un producto antes de continuar.</p>
      <Link href="/perros" className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-brand-blue px-5 font-semibold text-white">
        Ver productos
      </Link>
    </section>
  );
}

function MissingCheckoutSession() {
  return (
    <section className="rounded-xl bg-white p-7 sm:p-10">
      <h2 className="text-xl font-semibold">No pudimos recuperar este checkout</h2>
      <p className="mt-2 max-w-xl text-muted">
        Tu carrito sigue disponible. Volvé a iniciarlo para recalcular stock, envío y total antes de pagar.
      </p>
      <Link
        href="/checkout/iniciar"
        className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-brand-blue px-5 font-semibold text-white"
      >
        Reintentar checkout
      </Link>
    </section>
  );
}

function contactFromData(
  session: CheckoutSession | null,
  customer: CheckoutCustomerSummary | null | undefined,
  viewer: StorefrontViewer | undefined,
  saved: CustomerAddress | null,
): ContactDraft {
  const name =
    session?.contactName ||
    customer?.fullName ||
    (saved?.recipientName ?? (viewer?.authenticated && viewer.displayName !== viewer.email ? viewer.displayName : ""));
  const parts = splitContactName(name);
  return {
    firstName: parts.firstName,
    lastName: parts.lastName,
    phone: session?.contactPhone ?? customer?.phone ?? saved?.phone ?? "",
    email: session?.contactEmail ?? customer?.email ?? (viewer?.authenticated ? viewer.email : ""),
  };
}

function emptyAddress(): AddressDraft {
  return {
    label: "Casa",
    street: "",
    number: "",
    floor: "",
    department: "",
    neighborhood: "",
    city: "Buenos Aires",
    province: "Buenos Aires",
    postalCode: "",
    reference: "",
  };
}

function addressFromSaved(saved: CustomerAddress): AddressDraft {
  return {
    label: saved.label,
    street: saved.street,
    number: saved.number,
    ...splitApartment(saved.apartment),
    neighborhood: saved.neighborhood ?? "",
    city: saved.city,
    province: saved.province,
    postalCode: saved.postalCode,
    reference: saved.reference ?? "",
  };
}

function orderSavedAddresses(addresses: CustomerAddress[]) {
  return [...addresses].sort((left, right) => {
    if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1;
    const labelDifference = left.label.localeCompare(right.label, "es", { sensitivity: "base" });
    return labelDifference || left.id.localeCompare(right.id);
  });
}

function addressFromCheckout(address: Record<string, string>): AddressDraft {
  return {
    label: "Casa",
    street: address.street ?? "",
    number: address.number ?? "",
    ...splitApartment(address.apartment),
    neighborhood: address.neighborhood ?? "",
    city: address.city ?? "",
    province: address.province ?? "",
    postalCode: address.postalCode ?? "",
    reference: address.reference ?? "",
  };
}

function addressPayload(address: AddressDraft | CustomerAddress, contact: ContactDraft) {
  return {
    recipientName: "recipientName" in address ? address.recipientName : (contact.firstName + " " + contact.lastName).trim(),
    street: address.street,
    number: address.number,
    apartment: "apartment" in address ? (address.apartment ?? "") : apartmentPayload(address),
    neighborhood: address.neighborhood ?? "",
    city: address.city,
    province: address.province,
    postalCode: normalizeArgentinePostalCode(address.postalCode),
    reference: address.reference ?? "",
  };
}

function isCompleteAddress(address: AddressDraft) {
  return Boolean(
    address.street.trim() &&
    address.number.trim() &&
    address.city.trim() &&
    address.province.trim() &&
    address.postalCode.trim() &&
    hasRequiredDeliveryDetails(address),
  );
}

function apartmentPayload(address: AddressDraft) {
  return joinApartment(address);
}

function incompleteAddressMessage(address: AddressDraft) {
  const missing: string[] = [];
  if (!address.street.trim()) missing.push("la calle");
  if (!address.number.trim()) missing.push("el número");
  if (!address.city.trim()) missing.push("la ciudad");
  if (!address.province.trim()) missing.push("la provincia");
  if (!address.postalCode.trim()) missing.push("el código postal");
  if (!address.floor.trim()) missing.push("el piso");
  if (!address.department.trim()) missing.push("el departamento");
  return `Completá ${joinSpanish(missing)} para consultar el envío.`;
}

function joinSpanish(values: string[]) {
  if (values.length <= 1) return values[0] ?? "los datos necesarios";
  if (values.length === 2) return `${values[0]} y ${values[1]}`;
  return `${values.slice(0, -1).join(", ")} y ${values.at(-1)}`;
}

function productCountLabel(count: number) {
  return `${count} ${count === 1 ? "producto" : "productos"}`;
}

function addressTitle(address: AddressDraft) {
  if (!address.street || !address.number) return "Agregá una dirección de entrega";
  const apartment = apartmentPayload(address);
  return address.street + " " + address.number + (apartment ? ", " + apartment : "");
}

function addressDetail(address: AddressDraft) {
  return [address.neighborhood, address.city, address.province, address.postalCode].filter(Boolean).join(", ");
}

function slotsForOption(options: ShippingOption[], optionId: string | null | undefined) {
  if (!optionId) return [];
  return options.find((option) => option.id === optionId)?.deliverySlots ?? [];
}

function orderShippingOptions(options: ShippingOption[]) {
  return options
    .map((option) => ({ ...option, deliverySlots: [...option.deliverySlots].sort(compareDeliverySlots) }))
    .sort((left, right) => {
      if (left.available !== right.available) return left.available ? -1 : 1;
      const dateDifference = firstDeliveryTime(left) - firstDeliveryTime(right);
      if (dateDifference) return dateDifference;
      const costDifference = Number(left.cost) - Number(right.cost);
      if (Number.isFinite(costDifference) && costDifference) return costDifference;
      return left.id.localeCompare(right.id);
    });
}

function compareDeliverySlots(left: DeliverySlot, right: DeliverySlot) {
  const dateDifference = deliverySlotTime(left) - deliverySlotTime(right);
  return dateDifference || left.id.localeCompare(right.id);
}

function firstDeliveryTime(option: ShippingOption) {
  return option.deliverySlots[0] ? deliverySlotTime(option.deliverySlots[0]) : Number.POSITIVE_INFINITY;
}

function deliverySlotTime(slot: DeliverySlot) {
  const timestamp = Date.parse(`${slot.date}T${slot.start || "00:00"}:00Z`);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function slotKey(slot: DeliverySlot) {
  return `${slot.id}:${slot.date}`;
}

function sameDeliveryDate(slotDate: string, sessionDate: string | null | undefined) {
  return Boolean(sessionDate && slotDate === sessionDate.slice(0, 10));
}

function ShippingPriceLabel({ option }: { option: ShippingOption }) {
  if (!option.available) return <span className="shrink-0 text-sm">No disponible</span>;
  const shippingBenefit = option.benefit && Number(option.benefit.amount) > 0 ? option.benefit : null;
  return (
    <span className="flex shrink-0 items-center gap-2 text-sm tabular-nums">
      {shippingBenefit ? <del className="text-muted">{formatMoney(Number(shippingBenefit.amount))}</del> : null}
      {Number(option.cost) > 0 ? (
        <strong className="text-brand-blue">{formatMoney(Number(option.cost))}</strong>
      ) : (
        <strong className="text-brand-blue">Gratis</strong>
      )}
    </span>
  );
}

function formatPercentage(value: string) {
  const percentage = Number(value);
  if (!Number.isFinite(percentage)) return value;
  return `${percentage.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
}

function formatDeliveryDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function deliveryChoiceTitle(value: string) {
  const deliveryDate = value.slice(0, 10);
  const today = argentinaDateKey(new Date());
  const tomorrow = argentinaDateKey(new Date(Date.now() + 86_400_000));
  if (deliveryDate === today) return "Recibir hoy";
  if (deliveryDate === tomorrow) return "Recibir mañana";
  return "Próxima entrega";
}

function argentinaDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).formatToParts(value);
  const datePart = (type: "year" | "month" | "day") => parts.find((part) => part.type === type)?.value ?? "";
  return `${datePart("year")}-${datePart("month")}-${datePart("day")}`;
}

function paymentMethodLabel(method: AvailablePaymentMethod["paymentMethod"] | "") {
  return (
    (
      {
        MERCADO_PAGO: "Mercado Pago",
        PAYWAY: "Tarjeta de débito",
        BANK_TRANSFER: "Transferencia bancaria",
      } as Record<string, string>
    )[method] ?? "medio de pago"
  );
}

function paymentMethodDescription(method: AvailablePaymentMethod["paymentMethod"]) {
  if (method === "MERCADO_PAGO") return "Pagá de forma segura con Mercado Pago.";
  if (method === "BANK_TRANSFER") return "Recibí las instrucciones después de confirmar.";
  return "Pagá con tarjeta de débito de forma segura.";
}

function loadPaywaySdk() {
  if (typeof window === "undefined") return Promise.reject(new Error("Payway solo puede cargarse en el navegador."));
  if (window.Decidir) return Promise.resolve();
  if (paywaySdkPromise) return paywaySdkPromise;
  paywaySdkPromise = new Promise<void>((resolve, reject) => {
    const currentScript = document.querySelector<HTMLScriptElement>("script[data-patitas-payway-sdk]");
    if (currentScript) {
      currentScript.addEventListener("load", () => resolve(), { once: true });
      currentScript.addEventListener("error", () => reject(new Error("No pudimos cargar Payway.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = PAYWAY_SDK_URL;
    script.async = true;
    script.dataset.patitasPaywaySdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No pudimos cargar Payway."));
    document.head.appendChild(script);
  }).catch((error) => {
    paywaySdkPromise = null;
    throw error;
  });
  return paywaySdkPromise;
}

function tokenizePaywayCard(
  form: HTMLFormElement | null,
  sdk: PaywaySdk | null,
): Promise<{ token: string; paymentMethodId: number; bin: string; installments: number }> {
  if (!form || !sdk) return Promise.reject(new Error("El pago con tarjeta no está disponible en este momento."));
  const cardInput = form.elements.namedItem("payway-card-number");
  if (!(cardInput instanceof HTMLInputElement)) return Promise.reject(new Error("Completá los datos de tu tarjeta para continuar."));
  const cardNumber = cardInput.value.replace(/\D/g, "");
  if (cardNumber.length < 15) return Promise.reject(new Error("Revisá el número de tarjeta e intentá nuevamente."));
  const paymentMethodId = paywayDebitPaymentMethodId(cardNumber);
  if (!paymentMethodId) return Promise.reject(new Error("Por ahora aceptamos tarjetas de débito Visa, Mastercard o Cabal."));
  cardInput.value = cardNumber;
  return new Promise((resolve, reject) => {
    sdk.createToken(form, (status, response) => {
      const token = typeof response?.token === "string" ? response.token : typeof response?.id === "string" ? response.id : "";
      if ((status === 200 || status === 201) && token) {
        resolve({ token, paymentMethodId, bin: cardNumber.slice(0, 6), installments: 1 });
        return;
      }
      reject(new Error("No pudimos validar la tarjeta. Revisá los datos e intentá nuevamente."));
    });
  });
}

function paywayDebitPaymentMethodId(cardNumber: string) {
  if (/^4/.test(cardNumber)) return PAYWAY_DEBIT_PAYMENT_METHODS.visa;
  if (/^(5[1-5]|2(?:2[2-9]|[3-6]\d|27[01]|272))/.test(cardNumber)) return PAYWAY_DEBIT_PAYMENT_METHODS.mastercard;
  if (/^(6042|5896)/.test(cardNumber)) return PAYWAY_DEBIT_PAYMENT_METHODS.cabal;
  return null;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch("/api/commerce" + path, {
    ...init,
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  const payload = (await response.json().catch(() => null)) as T | CheckoutConflict | { message?: string; code?: string } | null;
  const errorPayload = payload && typeof payload === "object" ? (payload as CheckoutConflict) : null;
  const checkoutSessionExpired =
    response.status === 409 &&
    (errorPayload?.code === "CHECKOUT_SESSION_EXPIRED_CONFLICT" ||
      errorPayload?.code === "CHECKOUT_SESSION_INVALID" ||
      (typeof errorPayload?.message === "string" && /sesión(?: de)? checkout.*expir/i.test(errorPayload.message)));
  if (checkoutSessionExpired || errorPayload?.code === "CHECKOUT_SESSION_INVALID") {
    window.dispatchEvent(new Event("patitas-session-invalid"));
  }
  if (response.status === 401 && errorPayload?.code !== "CHECKOUT_SESSION_INVALID") await invalidateClientSession();
  if (!response.ok) {
    throw new CheckoutRequestError(
      errorPayload?.message ?? "Patitas API no pudo completar el paso.",
      response.status,
      errorPayload?.code,
      errorPayload?.currentState,
    );
  }
  return payload as T;
}

async function invalidateClientSession() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // El BFF ya limpia las cookies; la notificación mantiene consistente la sesión visual.
  } finally {
    window.dispatchEvent(new Event("patitas-session-invalid"));
    notifySessionChanged();
  }
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

function splitContactName(name: string | null | undefined) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return { firstName: parts.shift() ?? "", lastName: parts.join(" ") };
}

function errorMessage(cause: unknown, fallback: string) {
  if (cause instanceof CheckoutRequestError) {
    if (cause.code === "CHECKOUT_SESSION_INVALID") return "La sesión de compra expiró. Volvé al carrito para iniciar una compra nueva.";
    if (cause.status === 401 || cause.code === "AUTH_SESSION_INVALID") return "Tu sesión expiró. Iniciá sesión nuevamente para continuar.";
    if (cause.status === 403) return "No tenés permisos para realizar esta acción con esta cuenta.";
    if (cause.status === 404) return "No encontramos este checkout. Volvé al carrito para iniciar uno nuevo.";
    if (cause.status === 429) return "Recibimos demasiados intentos seguidos. Esperá un momento y volvé a intentar.";
    if (cause.status >= 500) return "El servicio está temporalmente ocupado. Esperá un momento y volvé a intentar.";
  }
  if (cause instanceof TypeError && /fetch|network|conect/i.test(cause.message)) {
    return "No pudimos conectarnos. Revisá tu conexión y volvé a intentar.";
  }
  return cause instanceof Error ? cause.message : fallback;
}

function paymentErrorMessage(cause: unknown) {
  if (cause && typeof cause === "object" && "code" in cause) {
    if (cause.code === "PAYMENT_PROVIDER_UNAVAILABLE")
      return "La pasarela de pago no está disponible en este momento. Intentá nuevamente en unos minutos.";
    if (cause.code === "PAYMENT_IDEMPOTENCY_CONFLICT")
      return "Este intento de pago ya existe. Consultá el estado del pedido antes de volver a intentarlo.";
  }
  const message = errorMessage(cause, "No pudimos confirmar el pedido. Revisá stock, envío y datos.");
  if (/ya está pagado|ya fue pagado/i.test(message)) return "Este pedido ya figura como pagado.";
  if (/expiró|expirada|expirado/i.test(message)) return "La sesión u orden expiró. Volvé al carrito para iniciar un checkout nuevo.";
  if (/proveedor|pasarela|disponible/i.test(message))
    return "La pasarela de pago no está disponible en este momento. Intentá nuevamente en unos minutos.";
  return message;
}
