export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions: string[];
  videoLink?: string;
  createdAt: number;
  categories: string[];
  isFavorite: boolean;
}

export const DEFAULT_CATEGORIES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Dessert",
  "Snack",
  "Vegetarian",
  "Vegan",
  "Quick & Easy",
  "Healthy",
  "Other",
];

export const DEFAULT_UNITS = [
  "g",
  "kg",
  "ml",
  "L",
  "cup",
  "tbsp",
  "tsp",
  "oz",
  "lb",
  "piece",
  "pinch",
  "whole",
  "slice",
  "handful",
  "to taste",
];
