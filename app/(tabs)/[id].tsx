import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, View, ActivityIndicator, Linking, Share } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Recipe } from '@/types/Recipe';

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedRecipes = await AsyncStorage.getItem('recipes');
      if (storedRecipes) {
        const recipes: Recipe[] = JSON.parse(storedRecipes);
        const found = recipes.find(r => r.id === id);
        setRecipe(found || null);
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      setError('Failed to load recipe');
    } finally {
      setIsLoading(false);
    }
  };

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
              const storedRecipes = await AsyncStorage.getItem('recipes');
              if (storedRecipes) {
                const recipes: Recipe[] = JSON.parse(storedRecipes);
                const updatedRecipes = recipes.filter(r => r.id !== id);
                await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
                router.back();
              }
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
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <ThemedText style={styles.shareButtonText}>Share</ThemedText>
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Ingredients</ThemedText>
          {recipe.ingredients.map((ingredient, index) => (
            <ThemedText key={index} style={styles.ingredient}>
              • {ingredient.amount} {ingredient.unit} {ingredient.name}
            </ThemedText>
          ))}

          <ThemedText type="subtitle" style={styles.sectionTitle}>Instructions</ThemedText>
          {recipe.instructions.map((instruction, index) => (
            <ThemedText key={index} style={styles.instruction}>
              {index + 1}. {instruction}
            </ThemedText>
          ))}

          {recipe.videoLink && (
            <>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Video Tutorial</ThemedText>
              <TouchableOpacity style={styles.videoLink} onPress={handleVideoLink}>
                <ThemedText style={styles.link}>Watch Video</ThemedText>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.editButton]}
              onPress={() => router.push({
                pathname: "/(tabs)/add",
                params: { id }
              })}>
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
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  ingredient: {
    marginLeft: 10,
    marginBottom: 8,
    fontSize: 16,
  },
  instruction: {
    marginLeft: 10,
    marginBottom: 12,
    fontSize: 16,
    lineHeight: 24,
  },
  videoLink: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  link: {
    color: '#007AFF',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 32,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  shareButton: {
    marginRight: 16,
  },
  shareButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
}); 