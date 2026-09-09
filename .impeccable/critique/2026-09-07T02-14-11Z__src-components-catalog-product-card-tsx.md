---
target: src/components/catalog/product-card.tsx
total_score: 28
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
target_identity: "file:/Users/alejandrojesussojoruiz/projects/patitas/patitas-web/src/components/catalog/product-card.tsx"
target_fingerprint: "sha256:2f7bf730b7f7976930e18df74c2227476215021e0ab2d71d4fecb4e677ec7e27"
target_path: /Users/alejandrojesussojoruiz/projects/patitas/patitas-web/src/components/catalog/product-card.tsx
timestamp: 2026-09-07T02-14-11Z
slug: src-components-catalog-product-card-tsx
---

## Design Health Score

| #         | Heuristic                       |     Score | Key Issue                                                                                         |
| --------- | ------------------------------- | --------: | ------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     |       3/4 | Precio, disponibilidad y agregado son visibles; la variante seleccionada se distingue débilmente. |
| 2         | Match System / Real World       |       3/4 | Presentación, precio/kg y entrega son conceptos familiares; falta duración estimada.              |
| 3         | User Control and Freedom        |       3/4 | Se puede cambiar presentación y abrir el detalle, pero variantes agotadas siguen seleccionables.  |
| 4         | Consistency and Standards       |       3/4 | Respeta tokens y controles; catálogo y featured tienen diferencias no siempre evidentes.          |
| 5         | Error Prevention                |       2/4 | Una presentación sin stock parece elegible hasta que falla el agregado.                           |
| 6         | Recognition Rather Than Recall  |       3/4 | Informa marca, variante, precio y entrega; nombres y badges truncados reducen reconocimiento.     |
| 7         | Flexibility and Efficiency      |       3/4 | Agregar y calcular rendimiento son accesos rápidos; falta duración o compra más directa.          |
| 8         | Aesthetic and Minimalist Design |       3/4 | Limpia y tranquila, aunque todavía cercana a un ecommerce genérico.                               |
| 9         | Error Recovery                  |       2/4 | Permite reintentar, pero el botón puede mostrar el mensaje crudo del API.                         |
| 10        | Help and Documentation          |       3/4 | “Calcular cuánto rinde” aporta valor; disponibilidad y entrega carecen de contexto suficiente.    |
| **Total** |                                 | **28/40** | **Base sólida, con fricciones en selección, estados y reconocimiento.**                           |

## Design Specificity Verdict

La tarjeta ya tiene señales propias de Patitas: precio por kilo, cálculo de rendimiento, entrega y una voz comercial contenida. La secuencia imagen → nombre → marca → oferta → presentación → precio → entrega → acción es clara.

La oportunidad principal es que la tarjeta haga visible la decisión real: qué presentación está seleccionada, si se puede comprar y qué cambia al seleccionarla.

El detector encontró cuatro avisos advisory:

- product-card.tsx:53: 15px.
- product-card.tsx:102: 11px.
- product-card.tsx:138: 10px.
- related-product-grid.tsx:15: 11px.

Son excepciones tipográficas compactas, probablemente intencionales, pero están fuera de la escala documentada. No hubo hallazgos de estructura, accesibilidad mecánica ni performance.

No hubo inspección de navegador ni overlay porque no hay runtime/browser disponible.

## Overall Impression

La tarjeta es ordenada y funcional para una compra normal. El mayor riesgo es que una persona elija una variante agotada o cambie de presentación sin recibir una confirmación suficientemente fuerte del nuevo precio y disponibilidad.

## What's Working

- Secuencia visual lógica y fácil de escanear.
- Precio por kilo para comparar presentaciones.
- “Calcular cuánto rinde” conecta con la propuesta diferencial.
- Botones y variantes tienen objetivos táctiles adecuados.
- La imagen tiene fallback accesible.
- Después de agregar, ofrece acceso a “Ver carrito”.
- El azul está reservado para acción y disponibilidad.

## Priority Issues

### [P1] Las variantes sin stock siguen pareciendo seleccionables

Evidencia: product-card.tsx:77 renderiza todas las variantes como botones; el agotamiento sólo cambia el tratamiento visual cerca de product-card.tsx:128.

Por qué importa: el usuario puede elegir una opción que Patitas ya sabe que no puede vender y descubrirlo recién al agregar.

Fix: deshabilitar variantes no comprables o marcarlas explícitamente como “Sin stock”; seleccionar automáticamente la primera variante comprable.

Comando sugerido: $impeccable harden

### [P1] La variante inicial no prioriza la mejor disponibilidad

Evidencia: product-card.tsx:22 toma la primera variante comprable.

Existe selectInitialVariant en src/lib/catalog-variants.ts, que prioriza TODAY, luego TOMORROW y después LATER, pero la tarjeta no la usa.

Por qué importa: si cambia el orden de la API, puede aparecer seleccionada una variante que llega más tarde aunque haya otra disponible antes.

Fix: reutilizar selectInitialVariant para que la selección inicial siga una regla estable.

Comando sugerido: $impeccable harden

### [P1] La variante seleccionada se distingue demasiado poco

Evidencia: product-card.tsx:126 depende principalmente de color y subrayado.

Por qué importa: en una grilla densa no siempre queda claro qué presentación se agregará.

Fix: borde azul, fondo soft-blue, semántica de selección única (aria-pressed o radio) y disponibilidad junto a la presentación.

Comando sugerido: $impeccable bolder

### [P2] Nombre y marca se recortan sin acceso completo

Evidencia: nombre con line-clamp-2 en product-card.tsx:53 y marca con truncate en product-card.tsx:62.

Por qué importa: se pueden perder diferencias relevantes como etapa de vida, tamaño o fórmula.

Fix: mantener el nombre a dos líneas, agregar title o un nombre accesible completo y evitar truncar la marca cuando aporte identificación.

Comando sugerido: $impeccable clarify

### [P2] El cambio de variante no se anuncia al lector de pantalla

Al cambiar la presentación cambian precio, precio/kg, entrega y estado de compra, pero no existe una región aria-live asociada a ese bloque.

Por qué importa: una persona con lector de pantalla puede cambiar de presentación sin enterarse del nuevo precio.

Fix: envolver el bloque dinámico en aria-live=polite y anunciar brevemente presentación y precio.

Comando sugerido: $impeccable audit

### [P2] El error de agregar puede exponer texto técnico

Evidencia: add-to-cart-button.tsx:40 muestra directamente cause.message.

Por qué importa: el API puede devolver mensajes internos, extensos o inconsistentes.

Fix: normalizar errores por categoría y usar copy accionable: “No pudimos agregarlo ahora. Revisá la disponibilidad e intentá nuevamente.”

Comando sugerido: $impeccable harden

## Persona Red Flags

- Comprador mobile comparando presentaciones: puede no distinguir con suficiente fuerza cuál quedó seleccionada.
- Comprador que elige una bolsa agotada: la variante parece disponible hasta que intenta agregarla.
- Usuario de lector de pantalla: cambia de variante sin anuncio del nuevo precio o estado.
- Persona que compara fórmulas o etapas: nombres truncados pueden ocultar información decisiva.
- Comprador recurrente: no ve duración estimada directamente en la tarjeta y debe entrar al detalle.

## Minor Observations

- OfferBadge usa 10px y muestra sólo la primera oferta; puede ser pequeño en mobile.
- El badge comunica que existe una oferta, pero no siempre cuál es el beneficio concreto.
- Featured usa h3 y catálogo usa h2; conviene validar la jerarquía según la página donde se insertan.
- La imagen siempre usa product.media[0]; podría no corresponder a la variante elegida si existen imágenes específicas.
- La tarjeta tiene poca respuesta hover; no es un defecto, pero puede reforzarse si se busca más tangibilidad.
- La duración estimada queda fuera por falta de ese dato en el contrato actual.
