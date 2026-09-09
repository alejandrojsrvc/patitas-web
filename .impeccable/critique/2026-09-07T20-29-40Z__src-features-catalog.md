---
target: src/app/perros, src/app/gatos y src/app/buscar - todos los listados de productos
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:/Users/alejandrojesussojoruiz/projects/patitas/patitas-web/src/features/catalog"
timestamp: 2026-09-07T20-29-40Z
slug: src-features-catalog
closed: true
---
# Critica de los listados de productos

## Design Health Score

| # | Heuristica | Puntaje | Problema clave |
|---|---|---:|---|
| 1 | Visibilidad del estado | 3 | Hay skeletons, conteo y seleccion visible, pero filtros y orden no comunican transicion pendiente. |
| 2 | Correspondencia con el mundo real | 3 | El lenguaje es cercano; "Presentacion" resulta abstracto y la apertura parece una plantilla editorial. |
| 3 | Control y libertad | 3 | Hay Escape, foco devuelto y limpieza; un filtro simple seleccionado no se desmarca desde la misma opcion. |
| 4 | Consistencia y estandares | 3 | Los tres listados comparten sistema; precio requiere Aplicar mientras el resto navega de inmediato. |
| 5 | Prevencion de errores | 2 | El precio evita negativos, pero permite minimo mayor que maximo. |
| 6 | Reconocimiento antes que recuerdo | 3 | Estados y filtros aplicados son visibles; en mobile todo el sistema queda detras de un control alto. |
| 7 | Flexibilidad y eficiencia | 2 | Hay busqueda, orden y facetas, pero listas y variantes no tienen una via compacta. |
| 8 | Diseno estetico y minimalista | 2 | El exceso de superficie blanca, borde y radio aplana la jerarquia. |
| 9 | Reconocer y recuperarse de errores | 2 | El vacio diagnostica mal la causa y el fallo tecnico no ofrece reintento. |
| 10 | Ayuda y documentacion | 2 | Hay descripcion basica, pero faltan ayudas en decisiones ambiguas. |
| **Total** |  | **25/40** | **Aceptable; necesita una revision importante de jerarquia** |

## Veredicto de especificidad

El catalogo tiene dos ideas realmente propias de Patitas: comprar para una mascota y calcular cuanto rinde una presentacion. Sin embargo, la composicion que las contiene es intercambiable con cualquier ecommerce: franja blanca de titulo, modulo enmarcado, pills de filtros, panel sticky, toolbar enmarcada y grilla de tarjetas. Esto contradice la "despensa tranquila", la geometria con jerarquia y el principio de poner producto y compra por encima del ornamento.

El detector recorrio 27 archivos TSX y encontro 0 problemas principales y 1 advisory: `design-system-font-size` en `src/components/catalog/catalog-intro.tsx:28`, porque `2.5rem` no pertenece a la escala documentada. No es un falso positivo sintactico, pero tampoco explica el malestar general: confirma que el problema es conceptual y compositivo, no una acumulacion de infracciones mecanicas.

No hubo inspeccion visual en navegador ni overlays: las reglas del proyecto prohiben iniciar o compilar el frontend sin autorizacion explicita y no habia automatizacion de navegador disponible. La evidencia visual de esta corrida es por estructura, estilos y estados del codigo.

## Impresion general

El catalogo funciona y tiene buena informacion de compra, pero la interfaz insiste demasiado en explicar, contener y separar. Antes de ver productos, el usuario atraviesa intro, personalizacion, filtros aplicados, filtro movil y ordenamiento. La mayor oportunidad es quitar chrome: que los productos dominen el primer viewport y que titulo, filtros y contexto de mascota se conviertan en herramientas silenciosas.

## Lo que funciona

1. Perros, gatos y buscar convergen en `CatalogResults`, por lo que una sola intervencion puede ordenar los tres listados.
2. Las tarjetas ofrecen informacion valiosa y especifica: variante, precio por kilo, rendimiento, entrega y stock.
3. El drawer de filtros tiene buen cuidado funcional: Escape, bloqueo de scroll, trampa y devolucion de foco.

## Problemas prioritarios

### [P1] La barra fija de filtros se convierte en un segundo header

**Por que importa:** en mobile ocupa viewport antes de los productos, compite con la cabecera y la busqueda, queda lejos de la zona natural del pulgar y depende de un `top-[9rem]` fragil ante zoom o cambios de altura.

**Correccion:** sacar el bloque blanco sticky. Integrar filtros y orden en una sola fila tranquila dentro del flujo. Si se necesita persistencia, usar un disparador compacto contextual o una accion inferior accesible, sin depender de una altura magica.

**Comando sugerido:** `$impeccable adapt`.

### [P1] Demasiados contenedores con borde y radio tienen el mismo peso

**Por que importa:** la mirada lee cajas antes que productos. Intro, mascota, sidebar, toolbar, filtros aplicados, tarjetas, variantes y badges repiten blanco + linea + redondeo; el sistema es consistente, pero monotonamente consistente.

**Correccion:** reducir la pagina a dos o tres niveles de superficie. Eliminar bordes de grupos pasivos, organizar con espacio y cambios tonales, y reservar outlines para controles interactivos o estados seleccionados.

**Comando sugerido:** `$impeccable distill`.

### [P1] Titulo, eyebrow, breadcrumb y descripcion repiten contexto

**Por que importa:** “Tienda para perros/gatos” no aporta una decision distinta al H1; “Catalogo” sobre resultados de busqueda es aun mas generico. La entrada se siente SEO/CMS y demora el inventario.

**Correccion:** dejar un H1 claro y una unica linea util solo cuando ayude a elegir. Mantener breadcrumbs en rutas anidadas, no en la raiz, y expresar especie mediante navegacion activa o una senal discreta, no mediante un caption redundante.

**Comando sugerido:** `$impeccable typeset`.

### [P1] Todas las decisiones aparecen al mismo tiempo

**Por que importa:** la personalizacion por mascota antecede al catalogo; las facetas desktop estan todas abiertas; cada tarjeta muestra simultaneamente ofertas, variantes, rendimiento, varios precios, entrega, stock y compra. Esto vuelve pesada una tarea que deberia sentirse cotidiana.

**Correccion:** producto primero. Convertir la mascota en mejora contextual, resumir facetas secundarias con disclosure, priorizar dos o tres filtros discriminantes y compactar variantes sin perder precio/kg ni rendimiento.

**Comando sugerido:** `$impeccable layout`.

### [P2] Estados y reglas menores erosionan la sensacion de calidad

**Por que importa:** el vacio dice “Estamos preparando esta seleccion” cuando en realidad no hubo coincidencias; el error menciona la API y no permite reintentar; Precio conserva “Abrir” aun abierto; un filtro simple activo no se puede desmarcar tocandolo otra vez.

**Correccion:** nombrar la causa real, ofrecer reintento o limpieza, reflejar el estado del disclosure y unificar el comportamiento de filtros.

**Comando sugerido:** `$impeccable harden`.

## Carga cognitiva

Carga alta: fallan 6 de 8 criterios. Hay demasiados focos simultaneos, jerarquia visual plana, decisiones concurrentes, grupos potencialmente mayores a cuatro opciones y escaso progressive disclosure. Agrupacion y memoria de estado si estan bien resueltas mediante secciones, filtros aplicados, conteo y precio visible.

Los puntos con mas de cuatro opciones potenciales son categoria, marca, etapa, presentacion, las variantes de cada producto y la suma de datos/acciones dentro de cada tarjeta.

## Recorrido emocional

La promesa inicial es calma, pero la primera parte de la pagina pide procesar encuadre y controles. En mobile, otra barra queda fijada debajo de header y busqueda. El valle emocional es: “vine a ver productos y la interfaz sigue presentandome herramientas”. La experiencia se recupera dentro de las tarjetas, donde rendimiento, precio por kilo, stock y entrega si generan confianza.

## Alertas por persona

**Casey, mobile y distraida:** la pila de cabecera, busqueda y filtros sticky reduce el area util; el drawer abre todas las facetas; las tarjetas de dos columnas concentran demasiados controles estrechos.

**Riley, casos limite:** min/max admite rangos invertidos; listas largas no tienen limite visual; el estado vacio confunde causa; `top-[9rem]` puede romperse con zoom o wrapping.

**Jordan, primera compra:** breadcrumb, caption, H1 y descripcion compiten por definir donde esta; “Presentacion” es ambiguo; filtros inmediatos y precio con Aplicar usan dos modelos mentales; la personalizacion opcional parece una tarea previa.

## Observaciones menores

- La toolbar repite la pagina que luego muestra la paginacion.
- Los pills de filtros aplicados miden 36px y “Limpiar todos” no garantiza un objetivo tactil de 44px.
- El skeleton de busqueda no replica mascota, filtros aplicados ni toolbar y puede producir salto de geometria.
- El sidebar desktop tambien es sticky pese a que el header desktop no lo es, dejando un hueco arbitrario.
- Buscar merece una variante pequena pero intencional; hoy cambia el texto, no la jerarquia.

## Preguntas de diseno

- Que pasaria si el primer viewport mostrara principalmente productos?
- Si desaparecieran todos los bordes, cuales dos limites realmente deberian volver?
- Elegir mascota es un requisito previo o una mejora contextual posterior a la intencion de compra?
- Como se verian los filtros si fueran el indice discreto de una despensa y no un panel de marketplace?
