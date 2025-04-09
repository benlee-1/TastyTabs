import * as SQLite from "expo-sqlite";
import { Recipe } from "@/app/types/Recipe";

const db = SQLite.openDatabaseSync("recipes.db");

export const initDatabase = async (): Promise<void> => {
  console.log("Initializing database...");
  try {
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        videoLink TEXT,
        createdAt INTEGER NOT NULL,
        categories TEXT NOT NULL,
        isFavorite BOOLEAN DEFAULT 0
      );`
    );
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

// Helper function to escape SQL strings
const escapeSql = (str: string) => {
  if (str === null || str === undefined) return "NULL";
  return `'${str.replace(/'/g, "''")}'`;
};

export const saveRecipe = async (recipe: Recipe): Promise<void> => {
  console.log("Saving recipe:", recipe);
  try {
    const query = `
      INSERT INTO recipes (id, title, ingredients, instructions, videoLink, createdAt, categories, isFavorite)
      VALUES (
        ${escapeSql(recipe.id)},
        ${escapeSql(recipe.title)},
        ${escapeSql(JSON.stringify(recipe.ingredients))},
        ${escapeSql(JSON.stringify(recipe.instructions))},
        ${escapeSql(recipe.videoLink || "")},
        ${recipe.createdAt},
        ${escapeSql(JSON.stringify(recipe.categories))},
        ${recipe.isFavorite ? 1 : 0}
      );
    `;
    console.log("Executing query:", query);
    await db.execAsync(query);
    console.log("Recipe saved successfully");
  } catch (error) {
    console.error("Error saving recipe:", error);
    throw error;
  }
};

interface SQLiteResult {
  rows: Recipe[];
}

export const getAllRecipes = async (): Promise<Recipe[]> => {
  console.log("Getting all recipes...");
  try {
    const results = await db.getAllAsync<any>(
      `SELECT * FROM recipes ORDER BY createdAt DESC;`
    );
    console.log("Retrieved recipes:", results);
    const recipes = results.map((result) => ({
      ...result,
      ingredients: JSON.parse(result.ingredients),
      instructions: JSON.parse(result.instructions),
      categories: JSON.parse(result.categories),
      isFavorite: Boolean(result.isFavorite),
    }));
    console.log("Parsed recipes:", recipes);
    return recipes;
  } catch (error) {
    console.error("Error getting recipes:", error);
    throw error;
  }
};

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  console.log("Getting recipe by id:", id);
  try {
    const result = await db.getFirstAsync<any>(
      `SELECT * FROM recipes WHERE id = ${escapeSql(id)};`
    );
    console.log("Retrieved recipe:", result);
    if (!result) return null;

    const recipe = {
      ...result,
      ingredients: JSON.parse(result.ingredients),
      instructions: JSON.parse(result.instructions),
      categories: JSON.parse(result.categories),
      isFavorite: Boolean(result.isFavorite),
    };
    console.log("Parsed recipe:", recipe);
    return recipe;
  } catch (error) {
    console.error("Error getting recipe by id:", error);
    throw error;
  }
};

export const deleteRecipe = async (id: string): Promise<void> => {
  console.log("Deleting recipe:", id);
  try {
    await db.execAsync(`DELETE FROM recipes WHERE id = ${escapeSql(id)};`);
    console.log("Recipe deleted successfully");
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
};

export const toggleFavoriteRecipe = async (id: string): Promise<void> => {
  console.log("Toggling favorite for recipe:", id);
  try {
    await db.execAsync(
      `UPDATE recipes SET isFavorite = NOT isFavorite WHERE id = ${escapeSql(
        id
      )};`
    );
    console.log("Recipe favorite toggled successfully");
  } catch (error) {
    console.error("Error toggling recipe favorite:", error);
    throw error;
  }
};

export const updateRecipe = async (recipe: Recipe): Promise<void> => {
  console.log("Updating recipe:", recipe);
  try {
    const query = `
      UPDATE recipes 
      SET title = ${escapeSql(recipe.title)},
          ingredients = ${escapeSql(JSON.stringify(recipe.ingredients))},
          instructions = ${escapeSql(JSON.stringify(recipe.instructions))},
          videoLink = ${escapeSql(recipe.videoLink || "")},
          categories = ${escapeSql(JSON.stringify(recipe.categories))},
          isFavorite = ${recipe.isFavorite ? 1 : 0},
          createdAt = ${recipe.createdAt}
      WHERE id = ${escapeSql(recipe.id)};
    `;
    console.log("Executing update query:", query);
    await db.execAsync(query);
    console.log("Recipe updated successfully");
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
};
