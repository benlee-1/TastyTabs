import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, View, ActivityIndicator, Linking, Share } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Recipe } from '@/app/types/Recipe';
import { getRecipeById, deleteRecipe, toggleFavoriteRecipe } from '../services/db';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function RecipeDetail() {
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecipe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const found = await getRecipeById(id);
      
      if (!found) {
        console.log('Recipe not found. ID:', id);
        setError('Recipe not found');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 2000);
      } else {
        setRecipe(found);
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      setError('Failed to load recipe');
    } finally {
      setIsLoading(false);
    }
  };

  // Load recipe on mount and when id changes
  useEffect(() => {
    loadRecipe();
  }, [id]);

  // Reload recipe when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRecipe();
    }, [id])
  );

  const handleDelete = async () => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRecipe(id);
              router.replace('/(tabs)');
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Alert.alert('Error', 'Failed to delete recipe');
            }
          }
        }
      ]
    );
  };

  const handleVideoLink = async () => {
    if (recipe?.videoLink) {
      try {
        await Linking.openURL(recipe.videoLink);
      } catch (error) {
        Alert.alert('Error', 'Could not open video link');
      }
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    
    try {
      const recipeText = `
${recipe.title}

Ingredients:
${recipe.ingredients.map(ingredient => `• ${ingredient.amount} ${ingredient.unit} ${ingredient.name}`).join('\n')}

Instructions:
${recipe.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

${recipe.videoLink ? `\nVideo Tutorial: ${recipe.videoLink}` : ''}

Shared from TastyTabs
`;

      await Share.share({
        message: recipeText,
        title: recipe.title,
      });
    } catch (error) {
      console.error('Error sharing recipe:', error);
      Alert.alert('Error', 'Failed to share recipe');
    }
  };

  const toggleFavorite = async () => {
    if (!recipe) return;

    try {
      await toggleFavoriteRecipe(recipe.id);
      setRecipe({ ...recipe, isFavorite: !recipe.isFavorite });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  // Add a handler for edit navigation
  const handleEdit = () => {
    if (!recipe) return;
    router.push({
      pathname: '/(tabs)/add/new',
      params: { id: recipe.id }
    });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Recipe',
            headerBackTitle: 'Back',
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Loading recipe...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Recipe',
            headerBackTitle: 'Back',
          }} 
        />
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadRecipe}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (!recipe) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Recipe',
            headerBackTitle: 'Back',
          }} 
        />
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Recipe not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{
          title: recipe.title,
          headerBackTitle: 'Back',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
                <ThemedText style={[styles.headerButtonText, recipe.isFavorite && styles.favoriteActive]}>
                  {recipe.isFavorite ? '★' : '☆'}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleEdit}
                style={styles.headerButton}
              >
                <ThemedText style={styles.headerButtonText}>Edit</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <ThemedText style={styles.headerButtonText}>Share</ThemedText>
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Recipe Header */}
          <View style={styles.recipeHeader}>
            <ThemedText type="title" style={styles.recipeTitle}>{recipe.title}</ThemedText>
            <View style={styles.metaInfo}>
              <ThemedText style={styles.dateText}>
                Added {new Date(recipe.createdAt).toLocaleDateString()}
              </ThemedText>
              {recipe.isFavorite && (
                <View style={styles.favoriteTag}>
                  <ThemedText style={styles.favoriteTagText}>★ Favorite</ThemedText>
                </View>
              )}
            </View>
            {recipe.categories && recipe.categories.length > 0 && (
              <View style={styles.categoriesContainer}>
                {recipe.categories.map((category) => (
                  <View key={category} style={styles.categoryTag}>
                    <ThemedText style={styles.categoryText}>{category}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Ingredients</ThemedText>
              <ThemedText style={styles.servingInfo}>{recipe.ingredients.length} items</ThemedText>
            </View>
            <View style={styles.ingredientsContainer}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <View style={styles.ingredientAmount}>
                    <ThemedText style={styles.ingredientText}>
                      {ingredient.amount} {ingredient.unit}
                    </ThemedText>
                  </View>
                  <View style={styles.ingredientDivider} />
                  <ThemedText style={styles.ingredientText}>
                    {ingredient.name}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Instructions</ThemedText>
              <ThemedText style={styles.servingInfo}>{recipe.instructions.length} steps</ThemedText>
            </View>
            <View style={styles.instructionsContainer}>
              {recipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionRow}>
                  <View style={styles.stepNumber}>
                    <ThemedText style={styles.stepNumberText}>{index + 1}</ThemedText>
                  </View>
                  <ThemedText style={styles.instructionText}>
                    {instruction}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Video Tutorial Section */}
          {recipe.videoLink && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Video Tutorial</ThemedText>
              <TouchableOpacity style={styles.videoLinkButton} onPress={handleVideoLink}>
                <ThemedText style={styles.videoLinkText}>Watch Video</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.editButton]}
              onPress={handleEdit}>
              <ThemedText style={styles.buttonText}>Edit Recipe</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.deleteButton]}
              onPress={handleDelete}>
              <ThemedText style={styles.buttonText}>Delete Recipe</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 32,
  },
  recipeHeader: {
    marginBottom: 32,
    paddingTop: 12,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  favoriteTag: {
    backgroundColor: '#FFE5B4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  favoriteTagText: {
    color: '#FF8C00',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  servingInfo: {
    fontSize: 14,
    color: '#666',
  },
  ingredientsContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientAmount: {
    width: 100,
  },
  ingredientDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#ddd',
    marginHorizontal: 12,
  },
  ingredientText: {
    fontSize: 16,
    flex: 1,
  },
  instructionsContainer: {
    gap: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
  },
  videoLinkButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLinkText: {
    color: '#0a7ea4',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#0a7ea4',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    marginRight: 16,
  },
  headerButtonText: {
    color: '#0a7ea4',
    fontSize: 20,
  },
  favoriteActive: {
    color: '#FF8C00',
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
}); 