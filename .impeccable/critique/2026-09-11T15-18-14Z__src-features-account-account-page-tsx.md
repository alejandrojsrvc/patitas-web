---
target: src/app/mi-cuenta/pedidos
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/alejandrojesussojoruiz/projects/patitas/patitas-web/src/features/account/account-page.tsx"
target_fingerprint: "sha256:54a497387b74a5bf56a0568fdca35a1e6974485af10578353ab39943a1415830"
target_path: /Users/alejandrojesussojoruiz/projects/patitas/patitas-web/src/features/account/account-page.tsx
timestamp: 2026-09-11T15-18-14Z
slug: src-features-account-account-page-tsx
---
## Design Health Score

| # | Heurística | Puntaje | Problema principal |
|---|---|---:|---|
| 1 | Visibilidad del estado del sistema | 3 | Buenos estados de carga, pago y error; el reclamo no muestra envío en curso y la entrega desaparece si aún no existe shipment. |
| 2 | Correspondencia con el mundo real | 3 | El lenguaje es claro, pero pedido, pago y envío aparecen como tres estados sin una narrativa común. |
| 3 | Control y libertad | 3 | Hay retorno, reintento y paginación; soporte no puede plegarse/cancelarse y el reintento puede terminar en recarga abrupta. |
| 4 | Consistencia y estándares | 3 | El shell es coherente; el detalle y el formulario de ayuda están menos resueltos que el resto de la cuenta. |
| 5 | Prevención de errores | 2 | La advertencia de conciliación evita cobros duplicados, pero el reclamo permite envíos repetidos y no explica cuándo puede cambiarse una dirección. |
| 6 | Reconocimiento antes que recuerdo | 2 | El historial muestra cantidad, fecha y total, pero no permite reconocer qué productos se compraron. |
| 7 | Flexibilidad y eficiencia | 1 | No hay recompra directa, búsqueda o atajo para compras recurrentes. |
| 8 | Diseño estético y minimalista | 3 | Es calmo y limpio, aunque el detalle es una única tarjeta larga y omite datos útiles. |
| 9 | Reconocer, diagnosticar y recuperarse de errores | 3 | Los errores son claros; la confirmación del reclamo no ofrece referencia ni plazo de respuesta. |
| 10 | Ayuda y documentación | 2 | Existe ayuda contextual, pero pago y entrega necesitan orientación más útil. |
| **Total** |  | **25/40** | **Aceptable; necesita mejoras significativas** |

## Design Specificity Verdict

**Veredicto: shell propio, núcleo transaccional intercambiable.** La cuenta se siente Patitas por SN Pro, el uso contenido de azul y amarillo, las tarjetas cálidas y el español rioplatense. Sin embargo, la lista y el detalle podrían pertenecer a cualquier ecommerce: número, fecha, estado genérico, cantidad y total. No expresan la promesa central de reconocer qué consume la mascota, estimar cuándo puede acabarse y facilitar la reposición.

**Evaluación de diseño:** la arquitectura general es familiar y serena, pero el pedido no responde con suficiente rapidez “qué compré, dónde llega, cuándo llega y qué puedo hacer ahora”. El mayor valle emocional aparece cuando no existe `shipment`: toda la sección de entrega desaparece sin explicar qué ocurrirá después.

**Escaneo determinístico:** `impeccable detect --json src/features/account/account-page.tsx` devolvió `[]`: 0 hallazgos, 0 reglas y 0 ubicaciones. Esto confirma que el problema no es una infracción mecánica del sistema visual sino la composición, la información omitida y la claridad de la experiencia. No hubo falsos positivos.

**Evidencia visual:** no se pudo abrir una vista de navegador ni inyectar overlays porque esta sesión no expone automatización de navegador y las reglas del proyecto impiden iniciar el servidor por iniciativa propia. La revisión visual es estática, basada en código, contratos, PRODUCT.md y DESIGN.md.

## Overall Impression

La pantalla tiene una base sólida, tranquila y confiable, especialmente en navegación, carga, error, conciliación y reintento de pago. Su mayor oportunidad es dejar de presentar un comprobante administrativo genérico y convertirse en un centro de seguimiento y recompra propio de Patitas.

## What's Working

- La navegación de cuenta es predecible: sidebar persistente en escritorio, disclosure compacto en mobile, iconos con texto y `aria-current`.
- Los estados de carga, sesión vencida, error, vacío, paginación, pago y conciliación están contemplados; la advertencia para evitar un cobro duplicado es particularmente buena.
- El lenguaje visual respeta “La despensa tranquila”: superficies planas, bordes cálidos, radios contenidos y color semántico sin ruido.

## Cognitive Load

**Moderada: 3 de 8 criterios fallan.** Pasan foco único, agrupación, chunking, una decisión por vez y disclosure progresivo. Fallan jerarquía visual porque el H1 sigue siendo “Tus pedidos” y el pedido concreto queda como H2; opciones mínimas porque soporte muestra cinco motivos de una vez y el menú mobile despliega cinco secciones más logout; y memoria de trabajo porque el usuario debe abrir cada tarjeta para recordar qué compró. No hay un punto de decisión principal con más de cuatro opciones salvo el selector de cinco motivos de reclamo.

## Emotional Journey

La entrada se siente calma y creíble. El badge de pago aprobado y el seguimiento son el pico de tranquilidad. El valle aparece cuando la entrega todavía no existe: no se muestra dirección, estimación ni “qué sigue”. El cierre también es débil: “Recibimos tu consulta” no informa número de caso ni expectativa de respuesta.

## Priority Issues

### P1 — El detalle omite información necesaria para verificar el pedido

**Por qué importa:** el usuario ve productos y total, pero no subtotal, descuento, envío, método de pago, dirección, instrucciones ni fecha/franja estimada, aunque esos campos existen en `OrderSummary`. No puede comprobar dónde llegará ni cómo se compuso el cobro.

**Corrección:** dividir el detalle en “Estado y entrega”, “Productos”, “Pago y totales” y “Dirección”; mostrar un estado explícito cuando la preparación del envío todavía no comenzó.

**Comando sugerido:** `$impeccable layout` y `$impeccable clarify`.

### P1 — El formulario de ayuda tiene brechas de accesibilidad y doble envío

**Por qué importa:** `select` e `input` no tienen etiquetas persistentes, el placeholder carga con el significado del campo, no existe estado pending/disabled y el éxito no tiene una expectativa operativa clara. En conexiones lentas invita a tocar “Enviar” varias veces.

**Corrección:** agregar labels visibles, descripción asociada, estado de envío, controles deshabilitados, anuncio de éxito y una referencia/plazo de respuesta si el backend puede proveerlo.

**Comando sugerido:** `$impeccable harden`.

### P2 — Los estados no forman una historia comprensible

**Por qué importa:** el estado del pedido aparece como texto, el pago como badge y el envío como bloque separado. El usuario debe inferir cómo se relacionan “Pago aprobado”, “En preparación” y “Recibido”; los eventos tampoco muestran su fecha disponible.

**Corrección:** crear un resumen compacto con estado actual, última actualización, próximo paso y excepciones accionables, manteniendo pago y logística como estados independientes en el modelo.

**Comando sugerido:** `$impeccable clarify`.

### P2 — El historial no permite reconocer ni reponer una compra

**Por qué importa:** cada tarjeta sólo muestra cantidad de productos, fecha, estado y total. Una persona recurrente debe abrir pedidos uno por uno y la pantalla no expresa el diferencial de reposición de Patitas.

**Corrección:** mostrar una síntesis breve de productos y entrega; para pedidos elegibles, sumar “Volver a pedir” o la señal de reposición correspondiente. Esto puede requerir ampliar `OrderListItem`.

**Comando sugerido:** `$impeccable distill`.

### P2 — La jerarquía del detalle sigue anclada en la sección

**Por qué importa:** “Tus pedidos” permanece como H1 y “Pedido #...” es H2. El usuario entró a una tarea concreta, pero la página sigue sintiéndose como una lista anidada.

**Corrección:** convertir “Pedido #...” en el H1 del detalle, conservar el enlace de regreso como contexto y adaptar la descripción a estado/próximo paso.

**Comando sugerido:** `$impeccable typeset`.

## Persona Red Flags

- **Casey, compradora mobile distraída:** no puede identificar la compra correcta sin abrir tarjetas; seguimiento y regreso son enlaces de texto pequeños; el reclamo no bloquea toques repetidos.
- **Riley, usuario de casos límite:** un `shipment` nulo elimina toda explicación de entrega; la ausencia de número público puede exponer un UUID largo; los reclamos rápidos y repetidos no se previenen.
- **Jordan, comprador primerizo:** debe descifrar tres sistemas de estado, no recibe explicación del próximo paso y encuentra un formulario de soporte sin labels.
- **Sofía, compradora recurrente de alimento:** espera reconocer qué alimento compró para su mascota y cuándo reponerlo; ni la lista ni el detalle conectan pedido, mascota, consumo y recompra.

## Minor Observations

- El metadata siempre dice “Mi cuenta”, por lo que el historial del navegador no identifica el pedido concreto.
- Los eventos de envío omiten `occurredAt`, aunque está disponible.
- “Ver seguimiento” abre otra pestaña sin advertirlo.
- El vacío invita a explorar, pero no aclara si se puede vincular una compra realizada como invitado.
- La paginación es clara, aunque los controles deshabilitados siguen siendo anchors neutralizados por CSS.

## Questions to Consider

- ¿Qué pasaría si el detalle comenzara por “Dónde está y qué sigue” en vez de una cabecera tipo comprobante?
- Si se quitaran logo y colores, ¿algo del historial seguiría revelando la promesa de reposición de Patitas?
- ¿Soporte debe estar siempre desplegado o aparecer cuando el estado de pago/entrega indica riesgo?
- ¿“Volver a pedir” pertenece al historial, a reposiciones o debería ser una única acción coherente visible en ambos lugares?
