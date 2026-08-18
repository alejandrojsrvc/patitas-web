# Patitas Inquietas — Web Visual Guide v1

## 1. Personalidad visual

Patitas debe sentirse:

**cercana + moderna + confiable + alegre + simple**

No buscamos estética de veterinaria, petshop barato ni una interfaz excesivamente infantil.

La referencia es una **marca DTC / producto digital moderno**, no un ecommerce tradicional.

---

## 2. Paleta

| Token | Color | Uso |
|---|---|---|
| `brand-blue` | `#0055FF` | Marca, CTA y elementos protagonistas |
| `brand-yellow` | `#FFEC00` | Acentos y momentos de energía |
| `ink` | `#171717` | Texto principal |
| `muted` | `#686868` | Texto secundario |
| `cream` | `#FFFDF5` | Fondo principal |
| `soft-blue` | `#EEF4FF` | Secciones y tarjetas |
| `soft-yellow` | `#FFF9C7` | Highlights |
| `border` | `#E8E8E3` | Bordes |
| `white` | `#FFFFFF` | Tarjetas y superficies |

No utilizar blanco puro como único fondo de toda la web.

---

## 3. Uso del amarillo

El amarillo **no es un segundo color principal**. El azul identifica a Patitas; el amarillo aporta energía.

Distribución visual aproximada:

- **70% neutros**
- **25% azul**
- **5% amarillo**

### Usarlo para
- badges y highlights;
- indicadores pequeños;
- estados seleccionados;
- stickers y detalles gráficos;
- algún CTA excepcional.

### Evitarlo para
- párrafos;
- grandes superficies repetidas;
- navbar completa;
- todos los botones;
- texto pequeño amarillo sobre blanco.

Botón amarillo: fondo `#FFEC00`, texto `#171717`.

---

## 4. Tipografía

### Bricolage Grotesque

Para H1, H2, H3 relevantes, números protagonistas y frases de marca.

**Desktop**
- H1: `72px / 0.95 / 700`
- H2: `52px / 1 / 650–700`
- H3: `32px / 1.1 / 650`
- Display: `88–104px`

**Mobile**
- H1: `44–48px`
- H2: `36px`
- H3: `26px`

### SN Pro

Para body, navegación, botones, formularios, labels, información funcional, dashboard y checkout.

- Body XL: `20px / 1.5`
- Body: `16px / 1.55`
- Small: `14px / 1.45`
- Caption: `12px / 1.4`
- Button: `15–16px / 600`

> **Bricolage = Patitas habla.**  
> **SN Pro = Patitas funciona.**

---

## 5. Radios

- Botón: `12px`
- Input: `12px`
- Tarjeta pequeña: `16px`
- Tarjeta grande: `24px`
- Hero/product cards: `28–32px`
- Pill: `999px`

No convertir todo en cápsulas.

---

## 6. Botones

### Primary
Fondo `#0055FF`, texto blanco, altura `52–56px`, radius `12px`.

**Armar mi Patitas →**

### Secondary
Fondo blanco, texto `#171717`, borde `#DADADA`.

**Ver cómo funciona**

### Yellow Action
Uso excepcional. Fondo `#FFEC00`, texto `#171717`.

**Agregar a mi próxima Patitas**

### Ghost
Sin fondo, texto azul.

**Ver detalles →**

---

## 7. Tarjetas

Evitar sombras fuertes. Priorizar superficie + borde + espacio.

```css
background: #FFFFFF;
border: 1px solid #E8E8E3;
border-radius: 24px;
```

Profundidad opcional:

```css
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
```

---

## 8. Pet Plan Card

```text
┌─────────────────────────────┐
│  [foto]                     │
│                             │
│  Kiara                  ••• │
│  Mestiza · 11 kg            │
│                             │
│  PRÓXIMA PATITAS            │
│                             │
│  28 AGO                     │
│  En 11 días                 │
│                             │
│  Alimento                   │
│  Bolsitas                   │
│  Snack dental               │
│                             │
│  [ Ver próxima entrega → ]  │
└─────────────────────────────┘
```

`28 AGO` puede usar Bricolage grande. El resto SN Pro. `PRÓXIMA PATITAS` puede usar una pill amarilla.

---

## 9. Product Card

Debe ser mucho más limpia que un marketplace.

```text
┌──────────────────────┐
│      [producto]      │
│                      │
│ Excellent            │
│ Adulto               │
│ 3 kg                 │
│                      │
│ $ XX.XXX             │
│                      │
│ + Agregar            │
└──────────────────────┘
```

Patitas transmite **tranquilidad**, no urgencia comercial permanente.

---

## 10. Cards de upsell

Puede existir mayor personalidad.

> **Un gustito extra**
>
> Lick Mat Patitas  
> + $12.500
>
> **+ Agregar a su próxima entrega**

Puede utilizarse `soft-yellow` o una variante azul con contenido blanco.

---

## 11. Inputs

- altura `56px`;
- radius `12px`;
- borde gris;
- focus azul;
- ring azul tenue.

Las opciones del onboarding pueden utilizar cards grandes seleccionables.

---

## 12. Badges

Ejemplos:

- **MÁS PEDIDO**
- **PRÓXIMA ENTREGA**
- **NUEVO**
- **RECOMENDADO**
- **AHORRAS $X**

Fondo `#FFEC00`, texto `#171717`, SN Pro `11–12px / 700`.

---

## 13. Fondos y ritmo

Alternar principalmente:

**Cream → White → Soft Blue → Blue → Cream**

Ejemplo:
- Hero → cream
- Cómo funciona → white
- Ejemplo Patitas → soft blue
- Beneficio → blue
- Productos → cream
- Testimonios → white
- CTA final → blue

---

## 14. Secciones azules

Fondo `#0055FF`.

> **Vos cuidás de ellos.  
> Nosotros nos acordamos.**

H2 blanco, body blanco suavizado y un pequeño elemento amarillo de énfasis.

---

## 15. Fotografía

Evitar stock genérico.

Preferir:
- mascotas reales;
- hogares reales;
- luz cálida;
- situaciones cotidianas;
- mascota recibiendo/interactuando con una caja Patitas;
- productos fotografiados limpiamente.

Se pueden recortar mascotas sobre formas gráficas azul/amarillo.

---

## 16. Lenguaje gráfico

No llenar la interfaz de huellas genéricas.

Usar las formas del **isotipo oficial** como fuente del lenguaje gráfico:

- fondos;
- máscaras;
- patterns;
- stickers;
- formas detrás de productos;
- separadores.

---

## 17. Iconografía

Utilizar **Phosphor Icons** para iconografía funcional, preferentemente pesos Regular/Bold.

Para elementos de identidad, priorizar iconografía propia:
- perro;
- gato;
- alimento;
- arena;
- caja Patitas;
- bolsas;
- snack;
- juguete;
- reposición.

Evitar emojis como iconografía permanente y evitar estética SaaS genérica.

---

## 18. Navbar

Desktop:

```text
[isotipo] Patitas Inquietas

Cómo funciona    Qué recibes    Preguntas

Entrar     [Armar mi Patitas]
```

Container máximo `1200–1280px`, mucho aire y sticky al hacer scroll.

Mobile:

```text
Logo                         ☰
```

---

## 19. Hero

```text
-------------------------------------------------------

   Que nunca le falte             [ MASCOTA ]
   lo que necesita.               [         ]
                                   [ CAJA    ]
   Alimento y esenciales           [PATITAS  ]
   entregados justo cuando         [         ]
   toca.

   [ Armar mi Patitas → ]

   ✓ Sin permanencia
   ✓ Cambia o salta cuando quieras

-------------------------------------------------------
```

Fotografía/composición protagonista a la derecha en desktop. Puede utilizarse una forma amarilla irregular detrás de la mascota.

---

## 20. CTA final

Evitar “Suscríbete ahora”.

> **Tu mascota ya tiene suficientes cosas de las que depender de vos.**
>
> De la comida podemos acordarnos nosotros.
>
> **Armar su Patitas →**

Fondo azul, texto blanco y un pequeño elemento amarillo.

---

## 21. Dashboard / producto

Reducir expresividad respecto al marketing:

- fondo `#F8F8F5`;
- cards blancas;
- texto negro;
- acciones azules;
- amarillo para estados concretos.

> **Marketing → emoción.**  
> **Producto → claridad.**

---

## 22. Spacing

Sistema base:

`4, 8, 12, 16, 24, 32, 48, 64, 80, 120`

- Card padding: `24–32px`
- Secciones desktop: `96–120px`
- Secciones mobile: `64–80px`
- Container: `1200–1280px`

El espacio en blanco forma parte de la percepción premium.

---

## 23. Jerarquía

> **Si todo llama la atención, nada llama la atención.**

Por pantalla/sección:
- un CTA principal;
- un protagonista visual;
- máximo un uso fuerte de amarillo.

---

# Resumen

**Bricolage Grotesque** → personalidad.  
**SN Pro** → claridad.  
**#0055FF** → Patitas.  
**#FFEC00** → energía.  
**Crema/blanco** → tranquilidad.  
**Isotipo** → lenguaje gráfico.  
**Fotografía real** → vínculo emocional.  
**Espacio** → sensación premium.

## Principio de producto

Patitas no debe parecer:

> **un lugar donde comprar alimento para mascotas.**

Debe parecer:

> **el servicio que se ocupa de que a tu mascota no le falte lo que necesita.**

El diseño, el copy y la experiencia deben reforzar esa diferencia.
