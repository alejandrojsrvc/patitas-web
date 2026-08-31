# Patitas backend handoff

Este documento separa el contrato que `patitas-web` ya consume de Patitas API de las capacidades operativas que todavía requieren configuración o desarrollo. El backend sigue siendo la fuente de verdad para stock, precios, descuentos, envíos y pagos.

## Auditoría SEO reproducible

Con el dominio publicado configurado, ejecutar `pnpm seo:audit -- https://dominio-real` para obtener un JSON con URLs del sitemap, páginas indexables, palabras del contenido principal, títulos, H1, enlaces internos y candidatos a páginas huérfanas. Este informe no mide backlinks externos ni reemplaza Search Console; esos datos deben incorporarse desde la propiedad verificada de Google.

## Estado actual del frontend

- La homepage prioriza categorías, productos y marcas publicables; la calculadora vive en `/calculadora-alimento`.
- El cálculo usa el proxy existente `POST /api/calculator`.
- El catálogo y sus precios vienen de Patitas API.
- El checkout consume sesiones, opciones y franjas de envío, cupones, métodos de pago y confirmación desde Patitas API.
- Mi cuenta consume perfil, pedidos, direcciones, mascotas y planes de reposición existentes.
- La landing no crea planes persistentes, no envía WhatsApp y no dispara cobros.
- El CTA de WhatsApp solo abre la URL configurada en `NEXT_PUBLIC_WHATSAPP_URL`; no simula mensajes ni automatizaciones.
- La landing `/pet-shop-caba` comunica una operación exclusivamente online, con cobertura inicial en CABA y sin dirección de tienda física.
- No se deben publicar testimonios, métricas, descuentos o promesas de entrega sin datos operativos reales.

## 0. Nombres públicos y SEO de producto

El nombre del producto que entrega la API debe estar listo para una persona compradora, no ser una abreviatura interna de catálogo.

- Publicar nombres como `Excellent Adulto Perros Medianos y Grandes`, no `Excellent Adulto M&B`.
- Evitar duplicar la marca dentro de `name` cuando ya viene separada en `brand.name`; el frontend normaliza la presentación visible mientras conviven ambos formatos.
- Mantener el peso en la variante. El frontend solo lo agrega al título cuando existe una única variante comprable.
- Si el backend incorpora `seoTitle` y `seoDescription` de producto, deben ser campos editoriales opcionales y nunca reemplazar el nombre comercial mostrado.
- Cada variante debe conservar `presentation`, `weightGrams`, precio y disponibilidad como fuente de verdad. No se crearán URLs canónicas distintas por peso mientras la selección viva en una sola página de producto.

### Stock disponible en la ficha pública

La ficha web necesita que cada elemento de `variants` en `GET /api/v1/products/:slug` incluya:

```json
{
  "availableQuantity": 4
}
```

- Debe ser un entero mayor o igual a cero, calculado como stock físico menos unidades reservadas.
- Debe corresponder a la variante y nunca al producto agregado.
- El carrito y el checkout deben volver a validar la cantidad antes de reservar o confirmar.
- Mientras el campo no forme parte del contrato, la web muestra una cantidad estimada identificada como tal y limita el selector a cinco unidades.

## 1. Plan de reposición

### Captura previa a la primera compra

La calculadora pública puede solicitar un aviso de reposición mediante:

`POST /api/v1/replenishment-leads`

El proxy frontend envía `productSlug`, `variantId`, `petWeightKg`, `lifeStage`, `estimatedDurationDays`, `calculationSource`, `email`, `whatsapp` opcional y `consent` por canal con su versión. El email y su consentimiento son obligatorios; WhatsApp solo se registra si existe número y consentimiento explícito.

La captura debe ser idempotente cuando corresponda, validar que el producto y la variante sean publicables y devolver un identificador de lead/plan. No debe crear una orden ni cobrar.

Crear un recurso persistente asociado a una orden, una cuenta o un acceso seguro de invitado.

### Datos mínimos

- `id`
- `customerId` nullable
- `orderId` nullable hasta que exista una primera compra
- `guestAccessTokenHash` nullable; nunca persistir el token en claro
- mascota: nombre, especie, peso, etapa de vida y raza opcional
- alimento: `productId`, `variantId`, SKU y presentación snapshot
- consumo diario estimado y unidad
- duración estimada mínima y máxima
- fuente del cálculo: fabricante o fallback general
- `estimatedDepletionDate`
- `nextReminderAt`
- canal de aviso: email o WhatsApp
- `consentAt`, `consentVersion` y `unsubscribedAt`
- estado: `ACTIVE`, `PAUSED`, `CANCELLED`, `COMPLETED`
- timestamps

### Operaciones disponibles en el contrato

- `GET/POST /api/v1/replenishment-plans` para listar o crear.
- `GET /api/v1/replenishment-plans/:id` para consultar.
- `PATCH /api/v1/replenishment-plans/:id/status` para cambiar el estado.
- `POST /api/v1/replenishment-plans/:id/reorder-cart` para crear el carrito de recompra sin cobrar.

La cuenta web lista planes y permite crear el carrito de recompra. La creación y recalibración guiada dependen del flujo de cálculo y no se exponen como un formulario aislado.

Toda operación debe devolver errores explícitos para variante inexistente, producto no vendible, stock insuficiente y token inválido.

## 2. Mercado Pago Checkout Pro

Implementar el pago real sin almacenar datos de tarjeta en Patitas.

- Crear una preferencia o sesión de pago ligada a una orden interna.
- Guardar el identificador externo de pago y el estado recibido.
- Procesar webhooks de forma idempotente.
- No marcar una orden como pagada solamente por el retorno del navegador.
- Manejar estados aprobado, pendiente, rechazado, cancelado y expirado.
- Validar nuevamente stock, precio, descuento, envío y total al confirmar.
- Permitir generar un enlace de pago único para una orden pendiente.

El frontend necesita recibir únicamente URL de pago, estado de orden y mensajes de error accionables.

### Contrato consumido por `patitas-web`

El contrato actual de `POST /api/v1/checkout/sessions/:id/confirm` respeta `Idempotency-Key` y acepta `{}` para Mercado Pago (o `payment` únicamente para Payway). Devuelve:

```json
{
  "order": {},
  "payment": {
    "provider": "mercadopago",
    "action": "REDIRECT",
    "status": "PENDING",
    "paymentUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect"
  },
  "publicToken": "token-de-consulta-para-invitado"
}
```

El frontend solo redirige cuando `action` es `REDIRECT` y `paymentUrl` es válida. El retorno del navegador debe permitir consultar el pedido y su `paymentStatus`; no debe marcar la orden como pagada. El webhook continúa siendo la fuente de verdad para el estado externo.

`GET /api/v1/payments/methods` determina los métodos habilitados. La web sólo ofrece Mercado Pago porque su integración es por redirección. Payway no debe mostrarse hasta que el frontend genere y envíe `payment.token`, `paymentMethodId`, `bin` e `installments`; habilitar el proveedor en backend no completa esa tokenización.

Una orden fallida se reintenta con `POST /api/v1/payments/orders/:id/link`, `Idempotency-Key` nuevo y sólo cuando la orden devuelve `canRetry: true` y `reconciliationRequired: false`.

El endpoint público de productos debe agregar a `meta` las facetas `brandSlugs`, `lifeStages` y `weightGrams`, calculadas sin paginación y excluyendo la dimensión que se está filtrando. Esto evita que la tienda descargue todo el catálogo para construir filtros.

## 3. Envíos y cobertura

El checkout consume la fuente operativa existente. El contrato vigente es:

- `GET /api/v1/checkout/sessions/:id/shipping-options` devuelve opciones `{ id, cost, deliverySlots }`.
- Cada franja devuelve `{ id, label, start, end, date }`.
- `PATCH /api/v1/checkout/sessions/:id/shipping-option` recibe `shippingOptionId` y `deliverySlotId` opcional.
- La sesión persiste `shippingDeliverySlot`, `shippingDeliveryDate`, `shippingEstimate` y `shippingCost`.

Las reglas configurables deben contemplar:

- Cobertura por barrio, código postal o polígono configurado.
- Franjas de entrega y días disponibles.
- Costo de envío y reglas de envío gratis.
- Restricciones por peso, producto o stock.
- Mensaje de plazo estimado.
- Estado claro cuando una dirección está fuera de cobertura.

No publicar “envío gratis en CABA”, “entrega en todo CABA” ni “puerta del departamento” hasta tener estas reglas configuradas y verificadas.

## 4. Recordatorios y WhatsApp

### Consentimiento

- No enviar mensajes comerciales sin consentimiento registrable.
- Guardar fecha, versión del texto y canal consentido.
- Incluir baja sencilla en cada email o conversación automatizada.
- Respetar ventanas y límites del proveedor de WhatsApp.

### Flujo sugerido

1. El pedido confirmado crea o propone un plan.
2. El sistema calcula `nextReminderAt` cinco días antes del agotamiento estimado.
3. Se envía un mensaje con acciones de confirmar, pausar o ver recompra.
4. Confirmar no debe cobrar automáticamente: debe crear o abrir un checkout.
5. El pago confirmado actualiza la siguiente fecha del plan.

El proveedor, las plantillas, los identificadores de conversación y los reintentos deben quedar configurables por entorno.

## 5. Carritos abandonados

Capturar solamente después de que la persona haya aceptado el canal y proporcionado un WhatsApp válido.

- Registrar evento de abandono y última actividad.
- No contactar únicamente por haber completado el peso de la mascota.
- Permitir una ventana configurable, inicialmente dos horas.
- Enviar como máximo el número de mensajes definido por la política comercial.
- No enviar si la persona compró, canceló el consentimiento o ya recibió un aviso equivalente.
- Registrar entregado, leído, respondido, convertido y fallido.

## 6. Eventos de marketing

Implementar eventos server-side y client-side deduplicados:

- `Quiz_Completed`: datos mínimos del cálculo, sin enviar información sensible innecesaria.
- `InitiateCheckout`: sesión, valor, moneda y productos.
- `Purchase`: orden confirmada, valor, moneda y productos.

Persistir atribución:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- landing inicial
- identificador anónimo consentido

Meta Pixel y Conversions API deben compartir un `event_id` para evitar duplicados.

## 7. Combos, cupones y referidos

El backend debe ser la fuente de verdad para precio y descuento.

- Definir ofertas por producto, variante, categoría o campaña.
- Devolver subtotal, descuento, envío y total final.
- Validar vigencia, uso máximo, stock y compatibilidad de promociones.
- Crear códigos de referidos con relación entre quien invita y quien compra.
- Registrar un ledger de saldo con motivo, orden de origen, vencimiento y reversa.
- Evitar que descuentos de referidos vuelvan negativo el margen del pedido.

El frontend no debe mostrar un precio “combo” fijo si la API no devuelve una oferta aplicable.

## 8. Contrato de errores y observabilidad

Todos los endpoints deben responder errores estructurados con:

- código estable
- mensaje para la persona usuaria
- detalles de campos cuando corresponda
- identificador de trazabilidad

Registrar fallos de pago, stock, envío, WhatsApp, webhooks y creación de recompra sin guardar secretos ni datos completos de tarjeta.

## Criterios de aceptación backend

- Una compra aprobada crea una orden válida y puede asociarse a un plan.
- Una notificación duplicada no crea dos órdenes ni dos planes.
- Una recompra nunca cobra sin confirmación explícita.
- Un plan pausado o cancelado no envía avisos.
- Un SKU agotado produce una alternativa o un estado accionable.
- Los eventos de marketing no se duplican.
- Los precios, descuentos, envío y stock se validan en servidor.
