# Carrito, checkout y retorno de pago

Revisión del 5 de septiembre de 2026. Implementación sobre los cambios existentes en ambos repositorios; no se hizo commit, despliegue ni cambios de configuración o de base de datos.

## Comportamiento implementado

- Checkout y mi cuenta usan el mismo buscador de Google. Los campos manuales permiten completar datos faltantes o continuar si Google no carga. La cobertura efectiva se consulta al API.
- Al seleccionar una dirección guardada se permite revisar piso, departamento y referencia antes de usarla. Actualizar la dirección de la cuenta es una elección explícita.
- Piso y departamento se serializan en el campo `apartment` del contrato existente. Los valores antiguos de texto libre se conservan.
- El envío sin seleccionar fecha y opción se muestra como pendiente de confirmar. El total se identifica como parcial hasta ese momento. Los descuentos y totales son los importes devueltos por el API.
- Los mensajes de monto restante usan la cotización del API y no aparecen cuando esa opción ya tiene costo cero.
- Las mutaciones del checkout deshabilitan los demás controles mientras actualizan los importes. Aplicar o quitar un cupón restablece la selección según la respuesta del API. Enter en el cupón aplica el código.
- La tienda ofrece Mercado Pago únicamente cuando está incluido entre los métodos disponibles del API. No se cambió la configuración administrativa de proveedores.
- El resumen se muestra antes del botón de pago en móvil y en una columna lateral en escritorio. Los campos editables usan texto de 16 px.
- El carrito muestra fallos de actualización y faltantes de stock, y bloquea continuar mientras cambia una cantidad.
- Se renueva la autenticación al iniciar checkout y en el BFF cuando falta el access token pero existe refresh token. Un rechazo de autenticación conserva el token del carrito anónimo.
- Se conserva la clave de confirmación durante un error de red y al recargar la pestaña. Un checkout completado ofrece recuperar el pedido existente.
- El API crea las tres URLs de retorno de Mercado Pago usando `PUBLIC_WEB_URL` y `orderId`. Para HTTPS agrega retorno automático cuando el pago fue aprobado.
- El retorno prioriza el identificador explícito del pedido, consulta su estado al API y no toma el parámetro `status` como prueba de pago. Mantiene polling acotado, consulta manual y reintento según `canRetry` y `reconciliationRequired`.

## Validaciones

- Web: 37 pruebas unitarias aprobadas, incluidos los casos de edición de piso/departamento y conservación del intento de confirmación.
- Web: verificación final de tipos y lint de los archivos modificados aprobados. Comprobación de whitespace del diff aprobada en ambos repositorios.
- API: 21 pruebas aprobadas en cuatro suites de Mercado Pago, precios de checkout, estado de mutaciones y cálculo de envío. El proveedor está simulado en las pruebas: no hubo cobros.
- Verificación de tipos del código de aplicación del API aprobada (`tsc --project tsconfig.build.json --noEmit --incremental false`). No genera un build.
- El chequeo global de tipos del API falla en archivos no modificados en esta tarea: `scripts/apply-pricing-catalog.ts`, `tests/unit/catalog/mobile-catalog.controllers.spec.ts` y `tests/unit/payments/prisma-payment.repository.spec.ts`.
- El detector visual de la skill no pudo ejecutarse: falta su detector incluido. La revisión de composición y estados se realizó sobre el código.

## Pendiente antes de publicar

No se ejecutaron servidores, builds, navegador, pruebas con base de datos ni compras reales. Estas comprobaciones siguen pendientes y no están cubiertas por las pruebas unitarias:

1. Verificar `PUBLIC_WEB_URL` con el dominio HTTPS de la tienda, las credenciales de Mercado Pago y la recepción del webhook firmado en el entorno de prueba.
2. Verificar la clave pública de Google, Places API y restricciones de dominio; probar una dirección completa, una sin código postal y la caída del buscador.
3. Compra de invitado y de cliente, dirección nueva y guardada, cambios de piso/departamento, cupón válido e inválido, primera compra gratis y monto mínimo de envío.
4. Pago aprobado, pendiente y rechazado, respuesta de confirmación perdida, retorno y recarga, reintento, expiración de sesión, stock y reserva.
5. Inspección de escritorio y móvil con teclado, autocompletado del navegador y textos largos; confirmar que el resumen, los errores y las acciones no queden tapados.

Referencias técnicas: [retornos de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/configure-back-urls) y [widget de Places](https://developers.google.com/maps/documentation/javascript/reference/places-widget).
