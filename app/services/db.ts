import * as SQLite from "expo-sqlite";
import { Recipe } from "@/app/types/Recipe"; 

interface DatabaseRecipe {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  videoLink: string;
  createdAt: number;
  categories: string;
  isFavorite: number;
}

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<void> => {
  console.log("Initializing database...");
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync("recipes.db");
    }

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

export const saveRecipe = async (recipe: Recipe): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  console.log("Saving recipe:", recipe);
  try {
    const query = `
      INSERT INTO recipes (id, title, ingredients, instructions, videoLink, createdAt, categories, isFavorite)
      VALUES (
        '${recipe.id}',
        '${recipe.title.replace(/'/g, "''")}',
        '${JSON.stringify(recipe.ingredients).replace(/'/g, "''")}',
        '${JSON.stringify(recipe.instructions).replace(/'/g, "''")}',
        '${(recipe.videoLink || "").replace(/'/g, "''")}',
        ${recipe.createdAt},
        '${JSON.stringify(recipe.categories).replace(/'/g, "''")}',
        ${recipe.isFavorite ? 1 : 0}
      );
    `;
    await db.execAsync(query);
    console.log("Recipe saved successfully");
  } catch (error) {
    console.error("Error saving recipe:", error);
    throw error;
  }
};

export const getAllRecipes = async (): Promise<Recipe[]> => {
  if (!db) throw new Error("Database not initialized");

  console.log("Getting all recipes...");
  try {
    const results = await db.getAllAsync<DatabaseRecipe>(
      `SELECT * FROM recipes ORDER BY createdAt DESC;`
    );

    const recipes = results.map((row) => ({
      ...row,
      ingredients: JSON.parse(row.ingredients),
      instructions: JSON.parse(row.instructions),
      categories: JSON.parse(row.categories),
      isFavorite: Boolean(row.isFavorite),
    }));
    console.log("Parsed recipes:", recipes);
    return recipes;
  } catch (error) {
    console.error("Error getting recipes:", error);
    throw error;
  }
};

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  if (!db) throw new Error("Database not initialized");

  console.log("Getting recipe by id:", id);
  try {
    const result = await db.getFirstAsync<DatabaseRecipe>(
      `SELECT * FROM recipes WHERE id = '${id.replace(/'/g, "''")}';`
    );

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
  if (!db) throw new Error("Database not initialized");

  console.log("Deleting recipe:", id);
  try {
    await db.execAsync(
      `DELETE FROM recipes WHERE id = '${id.replace(/'/g, "''")}';`
    );
    console.log("Recipe deleted successfully");
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
};

export const toggleFavoriteRecipe = async (id: string): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  console.log("Toggling favorite for recipe:", id);
  try {
    await db.execAsync(
      `UPDATE recipes SET isFavorite = NOT isFavorite WHERE id = '${id.replace(
        /'/g,
        "''"
      )}';`
    );
    console.log("Recipe favorite toggled successfully");
  } catch (error) {
    console.error("Error toggling recipe favorite:", error);
    throw error;
  }
};

export const updateRecipe = async (recipe: Recipe): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  console.log("Updating recipe:", recipe);
  try {
    const query = `
      UPDATE recipes 
      SET title = '${recipe.title.replace(/'/g, "''")}',
          ingredients = '${JSON.stringify(recipe.ingredients).replace(
            /'/g,
            "''"
          )}',
          instructions = '${JSON.stringify(recipe.instructions).replace(
            /'/g,
            "''"
          )}',
          videoLink = '${(recipe.videoLink || "").replace(/'/g, "''")}',
          categories = '${JSON.stringify(recipe.categories).replace(
            /'/g,
            "''"
          )}',
          isFavorite = ${recipe.isFavorite ? 1 : 0},
          createdAt = ${recipe.createdAt}
      WHERE id = '${recipe.id.replace(/'/g, "''")}';
    `;
    await db.execAsync(query);
    console.log("Recipe updated successfully");
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
};
