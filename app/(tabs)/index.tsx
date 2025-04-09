import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, View, TextInput, ScrollView, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Logo } from '@/components/Logo';
import { Recipe, DEFAULT_CATEGORIES } from '@/app/types/Recipe';
import { getAllRecipes, toggleFavoriteRecipe, deleteRecipe as deleteRecipeFromDb } from '@/app/services/db';

export default function RecipeList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  // Load recipes when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, loading recipes...');
      loadRecipes();
    }, [])
  );

  useEffect(() => {
    filterRecipes();
  }, [searchQuery, recipes, selectedCategory, showFavorites]);

  const loadRecipes = async () => {
    console.log('Loading recipes...');
    setIsLoading(true);
    setError(null);
    try {
      const loadedRecipes = await getAllRecipes();
      console.log('Loaded recipes:', loadedRecipes);
      setRecipes(loadedRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
      setError('Failed to load recipes');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
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
      await toggleFavoriteRecipe(recipeId);
      await loadRecipes(); // Reload recipes to get updated data
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      await deleteRecipeFromDb(recipeId);
      await loadRecipes(); // Reload recipes to get updated data
    } catch (error) {
      console.error('Error deleting recipe:', error);
      Alert.alert('Error', 'Failed to delete recipe');
    }
  };

  const handleDelete = (recipeId: string) => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteRecipe(recipeId)
        },
      ]
    );
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

  const handleAddRecipe = () => {
    // Force a fresh add page by replacing the current route
    router.replace('/(tabs)/add/new');
  };

  const handleEditRecipe = (recipeId: string) => {
    router.push({
      pathname: '/(tabs)/add/new',
      params: { id: recipeId }
    });
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
        styles.categoryButtonText,
        selectedCategory === item && styles.categoryButtonTextSelected
      ]}>
        {item}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderRightActions = (recipeId: string, isFavorite: boolean) => {
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.favoriteButton]}
          onPress={() => toggleFavorite(recipeId)}
        >
          <ThemedText style={styles.actionText}>
            {isFavorite ? '★' : '☆'}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(recipeId)}
        >
          <ThemedText style={styles.actionText}>🗑️</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item.id, item.isFavorite)}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
      hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
    >
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => router.push(`/(tabs)/${item.id}`)}
      >
        <View style={styles.recipeHeader}>
          <ThemedText type="title" style={styles.recipeTitle}>{item.title}</ThemedText>
          {item.isFavorite && (
            <ThemedText style={styles.favoriteIcon}>★</ThemedText>
          )}
        </View>

        <View style={styles.recipeInfo}>
          <ThemedText style={styles.recipeDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </ThemedText>
          {item.categories && item.categories.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              <View style={styles.categoryTagsRow}>
                {item.categories.map((category) => (
                  <View key={category} style={styles.categoryTag}>
                    <ThemedText style={styles.categoryTagText}>{category}</ThemedText>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        <View style={styles.ingredientPreview}>
          <ThemedText style={styles.ingredientCount}>
            {item.ingredients.length} ingredients
          </ThemedText>
          <ThemedText style={styles.previewText} numberOfLines={1} ellipsizeMode="tail">
            {item.ingredients.map(i => i.name).join(', ')}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  if (isLoading && !refreshing) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
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
      </GestureHandlerRootView>
    );
  }

  if (error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
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
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            headerTitle: () => <Logo />,
            headerRight: () => (
              <TouchableOpacity onPress={handleAddRecipe} style={styles.addButton}>
                <ThemedText style={styles.addButtonText}>+</ThemedText>
              </TouchableOpacity>
            ),
          }}
        />
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
    </GestureHandlerRootView>
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
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextSelected: {
    color: 'white',
  },
  categoryTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryTagText: {
    fontSize: 12,
    color: '#666',
  },
  list: {
    gap: 16,
    paddingVertical: 16,
  },
  recipeCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recipeTitle: {
    flex: 1,
    fontSize: 18,
    marginRight: 8,
  },
  favoriteIcon: {
    fontSize: 20,
    color: '#FF8C00',
  },
  recipeInfo: {
    marginBottom: 8,
    gap: 4,
  },
  recipeDate: {
    color: '#666',
    fontSize: 12,
  },
  categoriesScroll: {
    marginRight: -12,
  },
  categoryTagsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 12,
  },
  ingredientPreview: {
    marginTop: 4,
  },
  ingredientCount: {
    fontSize: 12,
    color: '#666',
  },
  previewText: {
    fontSize: 13,
    color: '#333',
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
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: '100%',
    borderRadius: 8,
  },
  favoriteButton: {
    backgroundColor: '#FF8C00',
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  addButton: {
    padding: 12,
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
});
