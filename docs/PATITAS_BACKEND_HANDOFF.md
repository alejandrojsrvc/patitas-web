# Patitas backend handoff

Este documento describe las capacidades necesarias para convertir la experiencia frontend de Patitas en una operación completa. No forman parte de la implementación frontend actual.

## Estado actual del frontend

- La homepage muestra una experiencia de cálculo de tres pasos.
- El cálculo usa el proxy existente `POST /api/calculator`.
- El catálogo y sus precios vienen de Patitas API.
- La landing no crea planes persistentes, no envía WhatsApp y no dispara cobros.
- La conversación de WhatsApp es una maqueta explícitamente ilustrativa.
- No se deben publicar testimonios, métricas, descuentos o promesas de entrega sin datos operativos reales.

## 1. Plan de reposición

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

### Operaciones requeridas

- Crear el plan después de una orden confirmada.
- Consultar planes de una cuenta autenticada.
- Consultar un plan de invitado mediante token seguro del pedido.
- Pausar, reactivar, adelantar o cancelar.
- Crear un carrito de recompra a partir del plan sin cobrar automáticamente.
- Recalcular o marcar el plan cuando cambia el precio, la presentación o el stock.

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

## 3. Envíos y cobertura

Crear una fuente operativa para que el checkout pueda calcular disponibilidad real.

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
