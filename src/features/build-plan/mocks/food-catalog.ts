import type { FoodBrand, FoodPresentation } from "../types";

const dogPresentations: FoodPresentation[] = [
  { id: "3kg", label: "3 kg", grams: 3_000 },
  { id: "7-5kg", label: "7,5 kg", grams: 7_500 },
  { id: "15kg", label: "15 kg", grams: 15_000 },
];

const catPresentations: FoodPresentation[] = [
  { id: "1kg", label: "1 kg", grams: 1_000 },
  { id: "3kg", label: "3 kg", grams: 3_000 },
  { id: "7-5kg", label: "7,5 kg", grams: 7_500 },
];

export const foodCatalog: FoodBrand[] = [
  {
    id: "excellent-dog",
    name: "Excellent",
    species: "dog",
    lines: [
      {
        id: "excellent-dog-adult",
        name: "Adulto",
        mockDailyGramsPerKg: 18,
        presentations: dogPresentations,
      },
      {
        id: "excellent-dog-puppy",
        name: "Cachorro",
        mockDailyGramsPerKg: 20,
        presentations: dogPresentations,
      },
    ],
  },
  {
    id: "pro-plan-dog",
    name: "Pro Plan",
    species: "dog",
    lines: [
      {
        id: "pro-plan-adult-complete",
        name: "Adult Complete",
        mockDailyGramsPerKg: 17,
        presentations: dogPresentations,
      },
      {
        id: "pro-plan-puppy",
        name: "Puppy",
        mockDailyGramsPerKg: 19,
        presentations: dogPresentations,
      },
    ],
  },
  {
    id: "excellent-cat",
    name: "Excellent",
    species: "cat",
    lines: [
      {
        id: "excellent-cat-adult",
        name: "Adulto Gato",
        mockDailyGramsPerKg: 13,
        presentations: catPresentations,
      },
      {
        id: "excellent-cat-kitten",
        name: "Kitten",
        mockDailyGramsPerKg: 14,
        presentations: catPresentations,
      },
    ],
  },
  {
    id: "royal-canin-cat",
    name: "Royal Canin",
    species: "cat",
    lines: [
      {
        id: "royal-canin-indoor",
        name: "Indoor",
        mockDailyGramsPerKg: 12,
        presentations: [
          { id: "1-5kg", label: "1,5 kg", grams: 1_500 },
          { id: "3kg", label: "3 kg", grams: 3_000 },
          { id: "7-5kg", label: "7,5 kg", grams: 7_500 },
        ],
      },
      {
        id: "royal-canin-kitten",
        name: "Kitten",
        mockDailyGramsPerKg: 13,
        presentations: [
          { id: "1-5kg", label: "1,5 kg", grams: 1_500 },
          { id: "3kg", label: "3 kg", grams: 3_000 },
          { id: "7-5kg", label: "7,5 kg", grams: 7_500 },
        ],
      },
    ],
  },
];
