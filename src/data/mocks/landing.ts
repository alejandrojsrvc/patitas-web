import type { Brand, FAQ, Product, SupplyPlan } from "@/types/landing";

const illustrativeDelivery = new Date();
illustrativeDelivery.setDate(illustrativeDelivery.getDate() + 11);

export const kiaraPlan: SupplyPlan = {
  pet: {
    name: "Kiara",
    species: "dog",
    description: "Mestiza adulta",
    weightKg: 11,
  },
  frequency: "mensual",
  nextDelivery: illustrativeDelivery.toISOString(),
  products: [
    {
      id: "kiara-food",
      name: "Excellent Adulto",
      detail: "Alimento seco · 3 kg",
      category: "food",
    },
    {
      id: "kiara-bags",
      name: "Bolsas sanitarias",
      detail: "2 rollos",
      category: "hygiene",
    },
    {
      id: "kiara-snack",
      name: "Snack dental",
      detail: "Un gustito opcional",
      category: "snack",
      optional: true,
    },
  ],
};

export const foodBrands: Brand[] = [
  { name: "Excellent" },
  { name: "Pro Plan" },
  { name: "Royal Canin" },
  { name: "Old Prince" },
];

export const addOns: Product[] = [
  {
    id: "slow-feeder",
    name: "Slow feeder",
    detail: "Para comer con más calma",
    category: "accessory",
  },
  {
    id: "lick-mat",
    name: "Lick mat",
    detail: "Un rato de entretenimiento",
    category: "accessory",
  },
  {
    id: "snacks",
    name: "Snacks",
    detail: "Para sumar a la próxima entrega",
    category: "snack",
  },
  {
    id: "interactive-toy",
    name: "Juguete interactivo",
    detail: "Un extra, no otra compra pendiente",
    category: "accessory",
  },
];

export const petSupplies = {
  dogs: ["Alimento", "Bolsas sanitarias", "Snacks", "Otros consumibles"],
  cats: ["Alimento", "Arena sanitaria", "Alimento húmedo", "Snacks"],
};

export const faqs: FAQ[] = [
  {
    question: "¿Tengo que cambiar el alimento de mi mascota?",
    answer:
      "No. Patitas está pensado para reponer el alimento que tu mascota ya consume. Configurás su marca y variedad habitual, y organizamos las próximas entregas.",
  },
  {
    question: "¿Puedo modificar una entrega?",
    answer:
      "Sí. Antes de cada entrega vas a poder cambiar productos, cantidades o la fecha según lo que necesites.",
  },
  {
    question: "¿Puedo saltar una entrega?",
    answer:
      "Sí. Si esa vez no necesitás reposición, podés saltarla sin perder la configuración de tu mascota.",
  },
  {
    question: "¿Puedo comprar una sola vez?",
    answer:
      "La propuesta principal de Patitas es el abastecimiento recurrente. La compra por única vez todavía no forma parte de esta primera etapa.",
  },
  {
    question: "¿Qué pasa si todavía me queda alimento?",
    answer:
      "Podés retrasar o saltar la próxima entrega. La frecuencia ordena tus compras, pero vos conservás el control.",
  },
  {
    question: "¿Qué zonas cubre Patitas?",
    answer:
      "La zona inicial prevista es Villa Crespo, CABA. Vamos a comunicar nuevas zonas a medida que ampliemos la cobertura.",
  },
  {
    question: "¿Puedo agregar otros productos a mi próxima entrega?",
    answer:
      "Sí. Podés sumar snacks, juguetes y otros complementos a una entrega futura sin convertirlos en productos recurrentes.",
  },
];
