import { useEffect, useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, View, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Logo } from '@/components/Logo';
import { Recipe, DEFAULT_CATEGORIES } from '@/types/Recipe';

export default function RecipeList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchQuery, recipes, selectedCategory, showFavorites]);

  const loadRecipes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedRecipes = await AsyncStorage.getItem('recipes');
      if (storedRecipes) {
        let recipes: Recipe[] = JSON.parse(storedRecipes);
        
        // Migrate old recipe IDs to new format
        let hasChanges = false;
        recipes = recipes.map(recipe => {
          if (!recipe.id.startsWith('recipe_')) {
            hasChanges = true;
            return { ...recipe, id: `recipe_${recipe.id}` };
          }
          return recipe;
        });
        
        // Save migrated recipes if any changes were made
        if (hasChanges) {
          await AsyncStorage.setItem('recipes', JSON.stringify(recipes));
        }

        // Sort recipes by creation date (newest first)
        recipes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setRecipes(recipes);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      setError('Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;

    // Apply favorites filter
    if (showFavorites) {
      filtered = filtered.filter(recipe => recipe.isFavorite);
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(recipe => 
        recipe.categories.includes(selectedCategory)
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(recipe => {
        const titleMatch = recipe.title.toLowerCase().includes(query);
        const ingredientMatch = recipe.ingredients.some(ingredient => 
          ingredient.name.toLowerCase().includes(query) ||
          ingredient.amount.toLowerCase().includes(query) ||
          ingredient.unit.toLowerCase().includes(query)
        );
        return titleMatch || ingredientMatch;
      });
    }

    setFilteredRecipes(filtered);
  };

  const toggleFavorite = async (recipeId: string) => {
    try {
      const updatedRecipes = recipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isFavorite: !recipe.isFavorite }
          : recipe
      );
      setRecipes(updatedRecipes);
      await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  const handleError = () => {
    setError(null);
    setIsLoading(true);
    loadRecipes();
  };

  const renderCategory = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item && styles.categoryButtonSelected
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item ? null : item)}
    >
      <ThemedText style={[
        styles.categoryText,
        selectedCategory === item && styles.categoryTextSelected
      ]}>
        {item}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => router.push(`/(tabs)/${item.id}`)}
    >
      <ThemedText type="title" style={styles.recipeTitle}>{item.title}</ThemedText>
      <View style={styles.recipeInfo}>
        <ThemedText style={styles.recipeDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </ThemedText>
        {item.categories && item.categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {item.categories.map((category) => (
              <View key={category} style={styles.categoryTag}>
                <ThemedText style={styles.categoryText}>{category}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.ingredientsContainer}>
        <ThemedText style={styles.ingredientsTitle}>Ingredients:</ThemedText>
        {item.ingredients.map((ingredient, index) => (
          <ThemedText key={index} style={styles.ingredient}>
            • {ingredient.amount} {ingredient.unit} {ingredient.name}
          </ThemedText>
        ))}
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <Logo size={32} />
            <ThemedText type="title">My Recipes</ThemedText>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0a7ea4" />
            <ThemedText style={styles.loadingText}>Loading recipes...</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <Logo size={32} />
            <ThemedText type="title">My Recipes</ThemedText>
          </View>
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={handleError}>
              <ThemedText style={styles.retryText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Logo size={32} />
          <ThemedText type="title">My Recipes</ThemedText>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.favoriteFilter,
              showFavorites && styles.favoriteFilterActive
            ]}
            onPress={() => setShowFavorites(!showFavorites)}
          >
            <ThemedText style={[
              styles.favoriteFilterText,
              showFavorites && styles.favoriteFilterTextActive
            ]}>
              {showFavorites ? '★ Favorites' : '☆ Favorites'}
            </ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesContainer}>
          <FlatList
            data={DEFAULT_CATEGORIES}
            renderItem={renderCategory}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
        {recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No recipes yet.</ThemedText>
            <ThemedText style={styles.emptySubtext}>Add your first recipe to get started!</ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredRecipes}
            renderItem={renderRecipe}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No recipes found</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  {searchQuery ? 'Try adjusting your search' : 'Add a recipe to get started'}
                </ThemedText>
              </View>
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterContainer: {
    marginBottom: 8,
  },
  favoriteFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    alignSelf: 'flex-start',
  },
  favoriteFilterActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  favoriteFilterText: {
    fontSize: 14,
    color: '#666',
  },
  favoriteFilterTextActive: {
    color: 'white',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    gap: 8,
    paddingRight: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonSelected: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  categoryTag: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  categoryTextSelected: {
    color: 'white',
  },
  list: {
    gap: 16,
    paddingVertical: 16,
  },
  recipeCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeTitle: {
    flex: 1,
    marginRight: 8,
  },
  recipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipeDate: {
    color: '#666',
    fontSize: 14,
  },
  ingredientsContainer: {
    marginTop: 12,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ingredient: {
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
