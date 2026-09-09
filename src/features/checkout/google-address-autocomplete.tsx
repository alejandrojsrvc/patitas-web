"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, SpinnerGap } from "@phosphor-icons/react";

import { normalizeArgentinePostalCode } from "./address-fields";

export type GoogleAddressSelection = {
  formattedAddress?: string;
  street?: string;
  number?: string;
  apartment?: string;
  neighborhood?: string;
  city?: string;
  province?: string;
  postalCode?: string;
};

type GoogleAddressComponent = {
  types: string[];
  longText?: string | null;
  shortText?: string | null;
};

type GooglePlace = {
  addressComponents?: GoogleAddressComponent[];
  formattedAddress?: string | null;
  fetchFields: (input: { fields: string[] }) => Promise<void>;
};

type GooglePlacePrediction = {
  toPlace: () => GooglePlace;
};

type GooglePlaceSelectEvent = Event & {
  placePrediction?: GooglePlacePrediction;
};

type GooglePlaceAutocompleteElement = HTMLElement & {
  placeholder: string;
  locationRestriction?: GoogleLocationRestriction | null;
};

type GoogleLocationRestriction = {
  north: number;
  south: number;
  east: number;
  west: number;
};

type GooglePlacesLibrary = {
  PlaceAutocompleteElement: new (options?: {
    includedPrimaryTypes?: string[];
    includedRegionCodes?: string[];
  }) => GooglePlaceAutocompleteElement;
};

type GoogleMaps = {
  maps?: {
    importLibrary?: (library: "places") => Promise<GooglePlacesLibrary>;
  };
};

declare global {
  interface Window {
    google?: GoogleMaps;
    gm_authFailure?: () => void;
    __patitasGoogleMapsReady?: () => void;
  }
}

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
let googleMapsPromise: Promise<GoogleMaps> | null = null;

// Rectángulo de búsqueda de CABA. La cobertura efectiva la sigue definiendo el backend.
const cabaLocationRestriction: GoogleLocationRestriction = {
  north: -34.526,
  south: -34.705,
  east: -58.335,
  west: -58.531,
};

export function GoogleAddressAutocomplete({
  onSelect,
  onError,
  manualFallbackAvailable = true,
}: {
  onSelect: (address: GoogleAddressSelection) => void;
  onError?: () => void;
  manualFallbackAvailable?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const onErrorRef = useRef(onError);
  const [status, setStatus] = useState<"loading" | "ready" | "resolving" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasTyped, setHasTyped] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onErrorRef.current = onError;
  }, [onError, onSelect]);

  useEffect(() => {
    if (!googleMapsApiKey || !containerRef.current) {
      setStatus("error");
      setErrorMessage("La búsqueda automática no está configurada en este momento.");
      onErrorRef.current?.();
      return;
    }

    let disposed = false;
    let selectionVersion = 0;
    const container = containerRef.current;

    void loadGoogleMaps(googleMapsApiKey)
      .then((google) => {
        const importLibrary = google.maps?.importLibrary;
        if (!importLibrary) throw new Error("Google Places no está disponible.");
        return importLibrary("places");
      })
      .then((places) => {
        if (disposed || !places || !container) return;

        const autocomplete = new places.PlaceAutocompleteElement({ includedRegionCodes: ["ar"] });
        autocomplete.locationRestriction = cabaLocationRestriction;
        autocomplete.placeholder = "Buscá calle y número";
        autocomplete.setAttribute("aria-label", "Buscá la calle y el número");
        autocomplete.style.display = "block";
        autocomplete.style.width = "100%";
        autocomplete.style.height = "44px";
        autocomplete.style.padding = "0";
        autocomplete.style.backgroundColor = "#ffffff";
        autocomplete.style.color = "#17191d";
        autocomplete.style.colorScheme = "light";
        autocomplete.style.fontFamily = "var(--font-sn-pro), Arial, sans-serif";
        autocomplete.style.fontSize = "16px";
        autocomplete.style.fontWeight = "400";
        autocomplete.style.lineHeight = "1.5";
        autocomplete.style.border = "0";
        autocomplete.style.borderRadius = "8px";
        autocomplete.style.textAlign = "left";
        autocomplete.addEventListener("gmp-error", () => {
          if (!disposed) {
            setErrorMessage(
              manualFallbackAvailable
                ? "No pudimos buscar sugerencias. Podés completar la dirección en los campos de abajo."
                : "No pudimos buscar sugerencias. Recargá la página e intentá nuevamente.",
            );
            onErrorRef.current?.();
          }
        });
        autocomplete.addEventListener("gmp-select", (event) => {
          void fillAddress(event as GooglePlaceSelectEvent);
        });
        autocomplete.addEventListener("input", () => {
          if (!disposed) {
            setHasTyped(true);
            setErrorMessage(null);
          }
        });
        container.replaceChildren(autocomplete);
        setStatus("ready");
        setErrorMessage(null);
      })
      .catch((cause) => {
        if (!disposed) {
          setStatus("error");
          setErrorMessage(addressAutocompleteError(cause));
          onErrorRef.current?.();
        }
      });

    return () => {
      disposed = true;
      container.replaceChildren();
    };

    async function fillAddress(event: GooglePlaceSelectEvent) {
      const version = ++selectionVersion;
      const prediction = event.placePrediction;
      if (!prediction) {
        setErrorMessage("Google no devolvió una sugerencia válida. Intentá nuevamente.");
        onErrorRef.current?.();
        return;
      }

      setStatus("resolving");
      setErrorMessage(null);
      const place = prediction.toPlace();
      try {
        await place.fetchFields({ fields: ["addressComponents", "formattedAddress"] });
      } catch {
        if (!disposed && version === selectionVersion) {
          setStatus("ready");
          setErrorMessage("No pudimos leer esa dirección. Elegí otra sugerencia o intentá nuevamente.");
          onErrorRef.current?.();
        }
        return;
      }
      if (disposed || version !== selectionVersion) return;

      const valueFor = (...types: string[]) => {
        const component = place.addressComponents?.find((item) => types.some((type) => item.types.includes(type)));
        return component?.longText ?? component?.shortText ?? undefined;
      };

      const formattedAddress = place.formattedAddress ?? "";
      const parsedAddress = parseStreetAndNumber(formattedAddress);
      const street = valueFor("route") ?? parsedAddress.street;
      const number = valueFor("street_number") ?? parsedAddress.number;
      const city = valueFor("locality", "postal_town", "administrative_area_level_2");
      const province = valueFor("administrative_area_level_1");
      const postalCode = normalizeArgentinePostalCode(valueFor("postal_code"));

      if (!street || !number) {
        setStatus("ready");
        setErrorMessage("La sugerencia no incluye calle y número. Elegí una dirección puntual, no solo una calle.");
        return;
      }
      if (!city || !province || !postalCode) {
        setStatus("ready");
        setErrorMessage("No pudimos obtener todos los datos de esa dirección. Elegí una sugerencia que incluya la dirección completa.");
        return;
      }

      setStatus("ready");
      setErrorMessage(null);
      onSelectRef.current({
        formattedAddress,
        street,
        number,
        apartment: valueFor("subpremise"),
        neighborhood: valueFor("neighborhood", "sublocality_level_1", "sublocality"),
        city,
        province,
        postalCode,
      });
    }
  }, [manualFallbackAvailable]);

  return (
    <div className="mb-4 text-left">
      <div className="flex items-center gap-2">
        <MapPin size={18} weight="duotone" className="shrink-0 text-brand-blue" aria-hidden="true" />
        <p className="text-sm font-semibold">Buscar dirección</p>
      </div>
      <p className="mt-1 text-sm text-muted">Buscá y seleccioná una dirección para consultar cobertura y fechas de entrega.</p>
      <div
        className={
          status === "error"
            ? "hidden"
            : "relative mt-2 min-h-11 rounded-lg border border-catalog-line bg-white transition-colors focus-within:border-brand-blue"
        }
        aria-busy={status === "loading" || status === "resolving"}
      >
        <div
          ref={containerRef}
          className={status === "ready" ? "min-h-11" : "pointer-events-none absolute inset-0 overflow-hidden opacity-0"}
          aria-hidden={status !== "ready"}
        />
        {status === "loading" || status === "resolving" ? (
          <div className="absolute inset-0 flex items-center gap-2 px-3 text-sm text-muted" role="status" aria-live="polite">
            <SpinnerGap size={17} className="shrink-0 animate-spin text-brand-blue" aria-hidden="true" />
            {status === "loading" ? "Cargando buscador…" : "Leyendo la dirección…"}
          </div>
        ) : null}
      </div>
      {status === "ready" && !errorMessage ? (
        <p className="mt-2 text-xs text-muted" role="status" aria-live="polite">
          {hasTyped
            ? "Elegí una sugerencia de la lista para continuar. Si no aparece ninguna, revisá la calle y el número."
            : "Escribí la calle y el número para ver sugerencias."}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-2 rounded-lg bg-[#fff8e8] p-3 text-sm text-[#6f5312]" role="alert">
          {status === "error" && manualFallbackAvailable
            ? "La búsqueda no está disponible. Completá la dirección en los campos de abajo para continuar."
            : status === "error"
              ? "La búsqueda no está disponible. Recargá la página e intentá nuevamente."
              : errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function parseStreetAndNumber(formattedAddress: string) {
  const firstAddressPart = formattedAddress.split(",")[0]?.trim() ?? "";
  const match = firstAddressPart.match(/^(.*?)[\s,]+(\d+[A-Za-z]?(?:\s*[-/]\s*\d+)?)$/u);
  return { street: match?.[1]?.trim() || undefined, number: match?.[2]?.trim() || undefined };
}

function loadGoogleMaps(apiKey: string): Promise<GoogleMaps> {
  const currentGoogle = window.google;
  if (currentGoogle?.maps?.importLibrary) return Promise.resolve(currentGoogle);
  if (googleMapsPromise) return googleMapsPromise;

  const promise = new Promise<GoogleMaps>((resolve, reject) => {
    const callbackName = "__patitasGoogleMapsReady";
    const script = document.createElement("script");
    let settled = false;
    const previousAuthFailure = window.gm_authFailure;
    const timeoutId = window.setTimeout(() => {
      finish(new Error("Google Maps tardó demasiado en responder."));
    }, 12000);

    const finish = (cause?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (window.__patitasGoogleMapsReady) delete window.__patitasGoogleMapsReady;
      if (previousAuthFailure) window.gm_authFailure = previousAuthFailure;
      else delete window.gm_authFailure;
      if (cause) reject(cause);
      else {
        const loadedGoogle = window.google;
        if (loadedGoogle?.maps?.importLibrary) resolve(loadedGoogle);
        else reject(new Error("Google Maps cargó sin habilitar Places."));
      }
    };

    window.__patitasGoogleMapsReady = () => finish();
    window.gm_authFailure = () => finish(new Error("Google Maps rechazó la API key o sus restricciones de dominio."));
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&v=weekly&loading=async&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.dataset.patitasGoogleMaps = "true";
    script.onerror = () => finish(new Error("Google Maps no pudo cargarse. Revisá la conexión o el dominio autorizado."));
    document.head.appendChild(script);
  });

  googleMapsPromise = promise.catch((error) => {
    googleMapsPromise = null;
    throw error;
  });

  return googleMapsPromise;
}

function addressAutocompleteError(cause: unknown) {
  if (cause instanceof Error && cause.message === "Google Maps rechazó la API key o sus restricciones de dominio.")
    return "Google Maps rechazó la API key o el dominio actual. Revisá las restricciones de la key.";
  if (cause instanceof Error && cause.message === "Google Maps cargó sin habilitar Places.")
    return "La key cargó, pero Places API no está habilitada en Google Cloud.";
  return "No pudimos activar la búsqueda. Revisá la configuración de Google Maps o recargá la página.";
}
