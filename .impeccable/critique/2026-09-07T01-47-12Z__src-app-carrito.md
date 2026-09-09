---
target: src/app/carrito
total_score: 25
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
target_identity: "file:/Users/alejandrojesussojoruiz/projects/patitas/patitas-web/src/app/carrito"
timestamp: 2026-09-07T01-47-12Z
slug: src-app-carrito
---

## Design Health Score

| #         | Heuristic                       |     Score | Key Issue                                                                             |
| --------- | ------------------------------- | --------: | ------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     |       3/4 | Hay carga, stock y errores, pero el CTA puede parecer activo mientras está bloqueado. |
| 2         | Match System / Real World       |       3/4 | Lenguaje rioplatense y conceptos familiares de compra.                                |
| 3         | User Control and Freedom        |       2/4 | Eliminar un producto no ofrece deshacer ni recuperación inmediata.                    |
| 4         | Consistency and Standards       |       3/4 | Respeta tokens, radios, controles y jerarquía del sistema.                            |
| 5         | Error Prevention                |       2/4 | El stock se detecta, pero no siempre guía al producto que requiere atención.          |
| 6         | Recognition Rather Than Recall  |       3/4 | Cada línea muestra imagen, presentación, precio unitario y total.                     |
| 7         | Flexibility and Efficiency      |       2/4 | Falta deshacer, recompra rápida y una acción de cantidad más eficiente.               |
| 8         | Aesthetic and Minimalist Design |       3/4 | Limpio y con buen contraste; el resumen no compite con los productos.                 |
| 9         | Error Recovery                  |       2/4 | Hay reintentos, pero algunos mensajes vienen crudos del API y falta un estado.        |
| 10        | Help and Documentation          |       2/4 | Se explica el envío, pero no hay acceso directo a cobertura o condiciones.            |
| **Total** |                                 | **25/40** | **Correcto en lo visual, frágil en estados bloqueados y recuperación.**               |

## Design Specificity Verdict

El carrito sí se siente parte de Patitas: usa la voz rioplatense, el azul como acción y una composición limpia de despensa digital. No parece un marketplace genérico. La oportunidad está en hacer que esa tranquilidad también aparezca cuando hay cambios de stock, errores de red o una vuelta desde un checkout vencido.

El detector encontró un único aviso advisory en `src/features/cart/cart-link.tsx:41`: el contador usa `11px`, fuera de la escala tipográfica documentada. Es una excepción razonable para un badge compacto, pero conviene documentarla o subirla a un tamaño del sistema.

La inspección de navegador no estuvo disponible; no hay overlay visual ni evidencia de runtime.

## Overall Impression

La base es clara y confiable para un carrito normal. El mayor problema no es la estética sino la continuidad: cuando algo impide avanzar, el usuario puede quedar mirando un CTA que parece disponible o volver desde checkout sin entender qué pasó.

## What's Working

- Buena jerarquía entre producto, presentación, precio unitario y total de línea.
- El costo de envío no se inventa: se comunica que se confirma en el siguiente paso.
- Hay estados de carga, carrito vacío, error y falta de stock.
- Los controles principales tienen tamaños táctiles adecuados.
- El estado vacío ofrece rutas diferenciadas para perros y gatos.
- Los totales y cantidades se basan en el carrito/API.

## Priority Issues

### [P1] El motivo `checkout-expired` se pierde al volver al carrito

**Evidencia:** `src/features/checkout/checkout-form.tsx:756` redirige a `/carrito?checkoutError=checkout-expired`, pero `src/app/carrito/page.tsx:33-42` no contempla ese valor.

**Por qué importa:** el usuario vuelve sin contexto y puede interpretar que perdió la compra o repetir una acción.

**Fix:** mostrar un aviso contextual: “La sesión de compra venció. Tu carrito sigue acá; revisá el subtotal y empezá una compra nueva.”

**Comando sugerido:** `$impeccable clarify`

### [P1] Se muestran mensajes crudos del API

**Evidencia:** `src/features/cart/cart-page.tsx:50` y `src/features/cart/cart-page.tsx:193`.

**Por qué importa:** pueden aparecer textos técnicos, demasiado largos o sin una recuperación clara.

**Fix:** normalizar por status/código (`401`, `404`, `409`, `429`, `5xx`, red) y acompañar cada error con una acción concreta.

**Comando sugerido:** `$impeccable harden`

### [P1] El CTA parece habilitado aunque no puede avanzar

**Evidencia:** `src/features/cart/cart-page.tsx:210-220` usa un enlace azul con `aria-disabled`; la cancelación ocurre en `onClick`.

**Por qué importa:** rompe la expectativa de acción y deja al usuario sin saber qué debe corregir.

**Fix:** usar un botón realmente deshabilitado durante carga/cambios y mostrar junto a él “Ajustá las cantidades marcadas para continuar”, con foco o enlace al primer producto afectado.

**Comando sugerido:** `$impeccable clarify`

### [P2] En mobile, continuar queda demasiado lejos

**Evidencia:** el CTA vive después de toda la lista, en `src/features/cart/cart-page.tsx:198-222`.

**Por qué importa:** los carritos largos obligan a desplazarse nuevamente para completar una acción primaria.

**Fix:** una barra inferior sticky sólo en mobile con subtotal y “Continuar con la compra”, respetando safe areas y sin tapar controles.

**Comando sugerido:** `$impeccable adapt`

### [P2] Eliminar no es reversible

**Evidencia:** `src/features/cart/cart-page.tsx:175-182` elimina directamente.

**Por qué importa:** un toque accidental obliga a buscar el producto otra vez y puede romper la intención de recompra.

**Fix:** toast breve con “Deshacer” o recuperación temporal del producto.

**Comando sugerido:** `$impeccable harden`

### [P2] El grupo de cantidad tiene semántica incompleta

**Evidencia:** `src/features/cart/cart-page.tsx:152` usa `aria-label` sobre un `div`, sin `role="group"` ni anuncio específico durante la actualización.

**Por qué importa:** un lector de pantalla puede no entender la relación entre disminuir, cantidad y aumentar.

**Fix:** agregar `role="group"`, nombre accesible y un estado `aria-live="polite"` para confirmar la cantidad guardada.

**Comando sugerido:** `$impeccable audit`

## Persona Red Flags

- **Invitado con conexión lenta:** ve carga, pero puede no distinguir entre carrito vacío y recuperación demorada.
- **Usuario que vuelve de checkout vencido:** no recibe explicación porque `checkout-expired` no se renderiza.
- **Usuario con stock cambiado:** ve el aviso en el producto, pero el CTA no lo lleva claramente al elemento que debe corregir.
- **Usuario de lector de pantalla:** el grupo de cantidad y el estado bloqueado del CTA podrían anunciarse mejor.
- **Comprador recurrente:** no tiene deshacer ni una acción rápida de recompra desde el carrito.

## Minor Observations

- El contador de carrito en `11px` es el único hallazgo automático; documentar la excepción o usar `12px`.
- “Seguir comprando” y “Continuar con la compra” son claros, pero el CTA primario debería explicitar por qué está bloqueado cuando corresponda.
- La ayuda de envío podría enlazar a cobertura/plazos sólo si existe contenido verificado.
- La lista de productos soporta nombres largos mejor que el badge y controles compactos; conviene probar zoom 200%.
