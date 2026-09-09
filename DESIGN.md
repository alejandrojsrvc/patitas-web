---
name: Patitas Inquietas
description: Una despensa digital cercana que ayuda a comprar y reponer con tranquilidad.
colors:
  brand-blue: "#0055FF"
  brand-yellow: "#FFEC00"
  ink: "#171717"
  muted: "#686868"
  page-bg: "#F7F9FC"
  soft-blue: "#EEF4FF"
  soft-yellow: "#FFF9C7"
  border: "#E8E8E3"
  surface: "#FFFFFF"
  catalog-canvas: "#FAFAF8"
  catalog-page: "#F5F5F5"
  catalog-soft: "#F5F5F2"
  catalog-line: "#E7E7E1"
  store-navy: "#182534"
typography:
  display:
    fontFamily: "SN Pro, Arial, sans-serif"
    fontSize: "clamp(3rem, 6vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "SN Pro, Arial, sans-serif"
    fontSize: "clamp(2.25rem, 4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "SN Pro, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "SN Pro, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "SN Pro, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  feature: "28px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  section-mobile: "56px"
  section-tablet: "72px"
  section-desktop: "88px"
components:
  button-primary:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "#0048DC"
    textColor: "{colors.surface}"
  button-yellow:
    backgroundColor: "{colors.brand-yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
    height: "56px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.brand-blue}"
    typography: "{typography.body}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "56px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  badge:
    backgroundColor: "{colors.brand-yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: Patitas Inquietas

## Overview

**Creative North Star: "La despensa tranquila"**

Patitas Inquietas se siente como una despensa digital preparada con cariño: cercana, ordenada y lista para resolver una necesidad cotidiana antes de que se convierta en urgencia. La interfaz combina la claridad de un producto digital moderno con una calidez doméstica contenida.

La expresión es alegre y reconocible, pero nunca ruidosa. El azul sostiene la confianza y la acción; el amarillo aparece como señal de energía; los neutros claros y limpios dejan respirar productos, contenido y decisiones. Los componentes pueden ser suaves, expresivos y juguetones, siempre con estructura clara y sin adoptar una estética infantil.

La referencia negativa es explícita: Patitas no debe parecer una veterinaria fría, un pet shop barato ni una interfaz excesivamente infantil.

**Key Characteristics:**

- Azul protagonista con amarillo escaso y enérgico.
- Neutros claros y superficies amplias que transmiten confianza y calma.
- Tipografía única, directa y amable.
- Geometría redondeada con jerarquía, no una colección de cápsulas.
- Producto y tareas de compra por encima del ornamento.

## Colors

La paleta combina un azul nítido y confiable con un amarillo de señal y una familia de grises muy claros y limpios.

### Primary

- **Azul Patitas** (`#0055FF`): identifica la marca, sostiene CTA principales, navegación protagonista, foco y estados seleccionados.

### Secondary

- **Amarillo Señal** (`#FFEC00`): aporta energía en badges, indicadores, pequeños énfasis y acciones excepcionales; no compite con el azul como color principal.
- **Azul Noche de Tienda** (`#182534`): alternativa oscura para secciones funcionales o acciones secundarias de alto contraste.

### Neutral

- **Tinta Cercana** (`#171717`): texto principal y controles sobre fondos claros.
- **Gris Conversación** (`#686868`): texto secundario, metadatos y ayudas.
- **Fondo Claro** (`#F7F9FC`): base casi blanca y levemente fría que transmite limpieza, confianza y descanso visual.
- **Azul Bruma** (`#EEF4FF`): estados suaves, selección, información y secciones de apoyo.
- **Amarillo Susurro** (`#FFF9C7`): promociones y highlights sin estridencia.
- **Línea Cálida** (`#E8E8E3`): bordes generales.
- **Superficie Limpia** (`#FFFFFF`): tarjetas, inputs y contenido elevado sobre fondos tonales.
- **Lienzo Catálogo** (`#FAFAF8`), **Página Catálogo** (`#F5F5F5`), **Fondo Catálogo** (`#F5F5F2`) y **Línea Catálogo** (`#E7E7E1`): capas neutras específicas de las superficies comerciales densas.

### Named Rules

**The 70/25/5 Rule.** Aproximadamente 70% de cada pantalla pertenece a neutros, 25% al azul y sólo 5% al amarillo.

**The Yellow Is a Signal Rule.** El amarillo marca energía o estado; no ocupa grandes superficies repetidas, párrafos ni toda la navegación.

## Typography

**Display Font:** SN Pro (con Arial y `sans-serif` como fallback)

**Body Font:** SN Pro (con Arial y `sans-serif` como fallback)

**Character:** Una sola familia hace que Patitas hable y funcione con la misma voz. La jerarquía surge del tamaño, el peso y un tracking compacto en títulos, no de mezclar tipografías decorativas.

### Hierarchy

- **Display** (600, `clamp(3rem, 6vw, 4.5rem)`, `0.98`): titulares principales y frases de marca; usa `text-wrap: balance` y tracking `-0.035em`.
- **Headline** (600, `clamp(2.25rem, 4vw, 3rem)`, `1`): apertura de secciones y decisiones principales.
- **Title** (600, `1.5rem`, `1.1`): títulos de tarjetas, módulos y grupos funcionales.
- **Body** (400, `1rem`, `1.55`): contenido funcional y explicativo; el ancho de lectura habitual no supera `65–75ch`.
- **Label** (700, `0.75rem`, tracking `0.04em`): badges, marcas y metadatos breves; puede usar mayúsculas cuando funciona como señal.

### Named Rules

**The One Voice Rule.** SN Pro es la voz de marca y de interfaz; la personalidad viene de la composición, no de sumar fuentes.

## Layout

El contenido vive en un contenedor fluido centrado: `min(100% - 1.25rem, 76rem)` en mobile, laterales de `3rem` desde `48rem`, y un máximo de `80rem` con laterales de `4rem` desde `90rem`. Las secciones usan un ritmo vertical de `56px`, `72px` y `88px` según viewport.

Las páginas comerciales alternan blanco, gris muy claro, azul suave y azul de marca. Mobile prioriza una sola columna, controles táctiles de al menos `44px` y carruseles o paneles desplazables cuando la comparación horizontal es útil; desktop expande grillas y navegación sin comprimir el contenido.

El espaciado se organiza sobre incrementos de `4px`, con `8–16px` dentro de controles, `24–32px` en tarjetas y `48px` o más entre grupos mayores. La densidad del catálogo puede ser más compacta que la landing, pero conserva separación clara entre imagen, nombre, variante, precio y acción.

## Elevation & Depth

El sistema es plano por defecto. La profundidad se construye primero con cambios de tono, bordes cálidos y espacio; las sombras ambientales se reservan para elementos flotantes, overlays, menús, modales y composiciones protagonistas.

### Shadow Vocabulary

- **Ambient Low** (`0 4px 12px rgba(24, 33, 43, 0.05)`): paginación y controles discretamente separados del lienzo.
- **Interactive Float** (`0 6px 18px rgba(23, 23, 23, 0.12)`): controles sobre imágenes y pequeños elementos flotantes.
- **Menu Float** (`0 14px 36px rgba(23, 23, 23, 0.14)`): dropdowns y paneles de búsqueda.
- **Feature Lift** (`0 12px 32px rgba(0, 50, 145, 0.10)`): una tarjeta protagonista dentro de una composición editorial.
- **Modal Lift** (`0 24px 70px rgba(22, 24, 29, 0.18)`): diálogos y superficies que deben separarse inequívocamente del contexto.

### Named Rules

**The Flat-By-Default Rule.** Una tarjeta en reposo usa superficie, borde y espacio; la sombra debe comunicar flotación, interacción o protagonismo real.

## Shapes

La forma base es rectangular y amable: `12px` en botones e inputs, `16px` en tarjetas pequeñas, `24px` en tarjetas grandes y `28px` en composiciones protagonistas. Los pills (`9999px`) quedan reservados para badges, estados y filtros breves. Los bordes son finos y cálidos; los recortes amplios se usan para fotografía y producto, no como decoración repetitiva.

## Components

Los componentes son suaves, expresivos y juguetones, pero conservan affordances directas, contraste suficiente y estados visibles.

### Buttons

- **Shape:** rectángulo suave con radio `12px`, altura habitual de `52–56px` y padding horizontal de `24px`.
- **Primary:** Azul Patitas con texto blanco y peso `600`; hover `#0048DC`, active `#003FBE`.
- **Hover / Focus:** transición de color de `200ms`; el foco global usa outline amarillo de `3px` con offset de `4px`.
- **Secondary:** superficie blanca, texto Tinta Cercana y borde cálido; en hover el borde y el texto pasan a azul.
- **Yellow:** acción excepcional con Amarillo Señal y texto oscuro; no sustituye al primary sistemáticamente.
- **Ghost:** texto azul, sin contenedor, con subrayado en hover.

### Chips

- **Style:** pills compactos con Amarillo Susurro y texto oscuro para ofertas, o Azul Bruma y Azul Patitas para entrega y selección.
- **State:** el seleccionado debe distinguirse también mediante peso, subrayado, borde o `aria-pressed`, nunca sólo por color.

### Cards / Containers

- **Corner Style:** `16px` en módulos pequeños, `24px` en contenedores y `28px` en piezas protagonistas.
- **Background:** blanco sobre lienzos tonales; azul o amarillo sólo cuando el módulo tiene una función expresiva clara.
- **Shadow Strategy:** plana por defecto; consultar Elevation & Depth antes de agregar sombra.
- **Border:** `1px` en Línea Cálida o Línea Catálogo.
- **Internal Padding:** `20–24px` normalmente, hasta `32px` en superficies editoriales.

### Inputs / Fields

- **Style:** superficie blanca, radio `12px`, borde gris cálido, altura preferida de `56px` y texto de `16px`.
- **Focus:** borde Azul Patitas y halo `0 0 0 4px rgba(0, 85, 255, 0.12)`, o ring amarillo cuando el campo vive sobre la cabecera azul.
- **Error / Disabled:** error en rojo oscuro sobre rosa muy pálido; disabled conserva legibilidad y reduce énfasis sin ocultar el estado.

### Navigation

La cabecera de ecommerce usa Azul Patitas, logo blanco, acciones blancas y acentos amarillos. En desktop separa búsqueda, categorías, cuenta y carrito; en mobile conserva marca, carrito, menú y búsqueda accesible. Hover y activo son visibles mediante fondo translúcido, amarillo o Azul Bruma según la superficie.

### Product Card

La tarjeta de producto es deliberadamente más limpia que un marketplace: imagen amplia y neutral, nombre y marca claros, variantes compactas, precio tabular y una sola acción primaria. Promociones y entrega aparecen como señales pequeñas, nunca como una pared de etiquetas.

## Do's and Don'ts

### Do:

- **Do** usar Azul Patitas como ancla de marca, foco y acción principal.
- **Do** reservar Amarillo Señal para badges, selección, pequeños acentos y acciones excepcionales.
- **Do** priorizar superficie, borde y espacio antes de agregar sombra.
- **Do** mantener objetivos táctiles de al menos `44px` y estados de foco visibles.
- **Do** usar mascotas reales, hogares cálidos, producto limpio y formas derivadas del isotipo cuando haya fotografía o recursos de marca disponibles.

### Don't:

- **Don't** convertir el amarillo en un segundo color dominante ni usarlo para párrafos.
- **Don't** convertir cada control, tarjeta o sección en una cápsula.
- **Don't** llenar la interfaz de huellas genéricas, emojis permanentes o recursos de stock impersonales.
- **Don't** imitar una veterinaria fría, un pet shop barato, un marketplace saturado ni una interfaz excesivamente infantil.
- **Don't** fabricar testimonios, métricas, fotografías propias o afirmaciones comerciales sin evidencia.
