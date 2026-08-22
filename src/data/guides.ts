export const guides = {
  "cuanto-alimento-come-un-perro": {
    title: "¿Cuánto alimento come un perro por día?",
    description: "Cómo interpretar la ración del fabricante y estimar cuánto alimento necesitás comprar.",
    paragraphs: [
      "No existe una cantidad única para todos los perros. El peso es el punto de partida, pero también influyen la etapa, la actividad, la condición corporal y la densidad energética del alimento.",
      "La referencia principal debe ser la tabla del fabricante del alimento elegido. Dos productos con bolsas del mismo peso pueden indicar raciones diarias distintas.",
      "Si la tabla ofrece valores para pesos cercanos al de tu perro, Patitas puede interpolarlos. Fuera del rango publicado usamos una estimación general y la marcamos claramente como orientativa.",
    ],
    cta: "Calcular para mi perro",
  },
  "cuanto-alimento-come-un-gato": {
    title: "¿Cuánto alimento come un gato por día?",
    description: "Una guía para comparar la ración diaria, el peso de la bolsa y la etapa de tu gato.",
    paragraphs: [
      "La ración diaria de un gato cambia según peso, edad, esterilización, actividad y tipo de alimento. Por eso conviene evitar una regla universal de gramos por kilo.",
      "Usá primero la tabla del envase. Si combina alimento seco y húmedo, la cantidad de cada uno debe ajustarse para no sumar dos raciones completas.",
      "La calculadora de Patitas informa de dónde sale el resultado. Cuando falta una tabla compatible, muestra que se trata de un fallback general.",
    ],
    cta: "Calcular para mi gato",
  },
  "cuanto-dura-una-bolsa-de-alimento-para-perros": {
    title: "¿Cuánto dura una bolsa de alimento para perros?",
    description: "Calculá la duración usando el peso de la bolsa y la ración diaria indicada para tu perro.",
    paragraphs: [
      "La cuenta básica es simple: gramos de la presentación divididos por gramos diarios. Una bolsa de 15 kg contiene 15.000 gramos.",
      "Lo importante es no adivinar la ración diaria. Buscala en la tabla del producto para el peso y la etapa de tu perro.",
      "La duración real puede cambiar. Cuando ya sabés cuánto le dura una bolsa en casa, ese consumo observado será una referencia más personalizada que la estimación inicial.",
    ],
    cta: "Comparar presentaciones",
  },
  "cuanto-dura-una-bolsa-de-alimento-para-gatos": {
    title: "¿Cuánto dura una bolsa de alimento para gatos?",
    description: "Estimá cuántos días cubre cada presentación según la ración diaria de tu gato.",
    paragraphs: [
      "Convertí el peso de la bolsa a gramos y dividilo por la ración diaria. Por ejemplo, 3 kg equivalen a 3.000 gramos.",
      "Si tu gato come alimento seco y húmedo, calculá la porción real de seco y no la recomendación de alimentación exclusiva.",
      "Además de la duración, revisá cómo conservar el alimento una vez abierto. Comprar una bolsa más grande no siempre es mejor si pierde frescura.",
    ],
    cta: "Calcular una presentación",
  },
} as const;
export type GuideSlug = keyof typeof guides;
