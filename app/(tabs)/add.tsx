import { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, Alert, Dimensions, Modal, Clipboard, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Recipe, DEFAULT_CATEGORIES, DEFAULT_UNITS, Ingredient } from '@/types/Recipe';

const { width } = Dimensions.get('window');
const AMOUNT_WIDTH = Math.min(80, width * 0.2);
const UNIT_WIDTH = Math.min(100, width * 0.25);

// Common ingredients for suggestions
const COMMON_INGREDIENTS = [
  'Salt', 'Pepper', 'Sugar', 'Flour', 'Eggs', 'Milk', 'Butter', 'Oil',
  'Onion', 'Garlic', 'Tomato', 'Carrot', 'Potato', 'Rice', 'Pasta',
  'Chicken', 'Beef', 'Fish', 'Cheese', 'Yogurt', 'Honey', 'Vinegar',
  'Soy Sauce', 'Olive Oil', 'Lemon', 'Lime', 'Ginger', 'Cinnamon',
  'Vanilla', 'Chocolate', 'Nuts', 'Seeds', 'Herbs', 'Spices'
];

export default function AddRecipe() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [videoLink, setVideoLink] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState<number | null>(null);
  const amountRefs = useRef<(TextInput | null)[]>([]);
  const unitRefs = useRef<(TextInput | null)[]>([]);
  const nameRefs = useRef<(TextInput | null)[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  const nameInputRefs = useRef<(View | null)[]>([]);

  useEffect(() => {
    if (id) {
      loadRecipe();
    }
  }, [id]);

  const loadRecipe = async () => {
    try {
      const storedRecipes = await AsyncStorage.getItem('recipes');
      if (storedRecipes) {
        const recipes = JSON.parse(storedRecipes);
        const recipe = recipes.find((r: Recipe) => r.id === id);
        if (recipe) {
          setTitle(recipe.title);
          setIngredients(recipe.ingredients);
          setInstructions(recipe.instructions);
          setVideoLink(recipe.videoLink || '');
          setSelectedCategories(recipe.categories || []);
          setIsFavorite(recipe.isFavorite || false);
        }
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert('Error', 'Failed to load recipe');
    }
  };

  const handleSave = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('Error', 'Please enter a recipe title');
        return;
      }

      if (ingredients.length === 0) {
        Alert.alert('Error', 'Please add at least one ingredient');
        return;
      }

      if (instructions.length === 0) {
        Alert.alert('Error', 'Please add at least one instruction');
        return;
      }

      const storedRecipes = await AsyncStorage.getItem('recipes');
      const recipes: Recipe[] = storedRecipes ? JSON.parse(storedRecipes) : [];
      
      // Check for duplicate title (case insensitive)
      const normalizedTitle = title.trim().toLowerCase();
      const existingRecipe = recipes.find(r => 
        r.title.toLowerCase() === normalizedTitle && r.id !== id
      );
      
      if (existingRecipe) {
        Alert.alert('Error', 'A recipe with this title already exists');
        return;
      }

      const recipeId = id || `recipe_${Date.now()}`;
      const newRecipe: Recipe = {
        id: recipeId,
        title: title.trim(),
        ingredients: ingredients.filter(i => i.name.trim()),
        instructions: instructions.filter(i => i.trim()),
        videoLink: videoLink.trim(),
        createdAt: Date.now(),
        categories: selectedCategories,
        isFavorite: isFavorite,
      };
      
      if (id) {
        // Update existing recipe
        const index = recipes.findIndex(r => r.id === id);
        if (index !== -1) {
          recipes[index] = { ...recipes[index], ...newRecipe };
        }
      } else {
        // Add new recipe
        recipes.push(newRecipe);
      }

      await AsyncStorage.setItem('recipes', JSON.stringify(recipes));

      // Clear all fields if this was a new recipe
      if (!id) {
        setTitle('');
        setIngredients([]);
        setInstructions([]);
        setVideoLink('');
        setSelectedCategories([]);
        setIsFavorite(false);
      }

      // Show success message
      Alert.alert(
        'Success',
        id ? 'Recipe updated successfully' : 'Recipe added successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to recipes list
              router.replace('/(tabs)');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe');
    }
  };

  const addIngredient = () => {
    const newIndex = ingredients.length;
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
    // Focus the amount input of the new row
    setTimeout(() => {
      amountRefs.current[newIndex]?.focus();
    }, 100);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);

    // Auto-focus next field
    if (field === 'amount' && value) {
      unitRefs.current[index]?.focus();
    } else if (field === 'unit' && value) {
      nameRefs.current[index]?.focus();
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const selectUnit = (unit: string) => {
    if (selectedIngredientIndex !== null) {
      updateIngredient(selectedIngredientIndex, 'unit', unit);
      setShowUnitPicker(false);
      // Focus the name input after selecting a unit
      nameRefs.current[selectedIngredientIndex]?.focus();
    }
  };

  const clearIngredientField = (index: number, field: keyof Ingredient) => {
    updateIngredient(index, field, '');
  };

  const handlePasteIngredients = async () => {
    try {
      const text = await Clipboard.getString();
      const lines = text.split('\n').filter(line => line.trim());
      
      const newIngredients = lines.map(line => {
        // Try to parse common formats like "2 cups flour" or "1/2 tsp salt"
        const match = line.match(/^(\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s*([a-zA-Z]+)\s+(.+)$/i);
        if (match) {
          return {
            amount: match[1],
            unit: match[2],
            name: match[3]
          };
        }
        // If no match, treat as ingredient name only
        return {
          amount: '',
          unit: '',
          name: line.trim()
        };
      });

      setIngredients([...ingredients, ...newIngredients]);
      setShowCopyModal(false);
    } catch (error) {
      console.error('Error pasting ingredients:', error);
      Alert.alert('Error', 'Failed to paste ingredients');
    }
  };

  const copyIngredients = () => {
    const text = ingredients
      .map(ing => `${ing.amount} ${ing.unit} ${ing.name}`)
      .join('\n');
    Clipboard.setString(text);
    Alert.alert('Success', 'Ingredients copied to clipboard');
  };

  const handleIngredientNameChange = (index: number, value: string) => {
    updateIngredient(index, 'name', value);
    
    // Show suggestions if there's text
    if (value.trim()) {
      const query = value.toLowerCase();
      const filtered = COMMON_INGREDIENTS.filter(ing => 
        ing.toLowerCase().includes(query)
      );
      setSuggestions(filtered);
      setSuggestionQuery(value);
      setSelectedIngredientIndex(index);
      
      // Measure the position of the input field
      nameInputRefs.current[index]?.measure((x, y, width, height, pageX, pageY) => {
        setSuggestionPosition({
          x: pageX,
          y: pageY + height
        });
        setShowSuggestions(true);
      });
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    if (selectedIngredientIndex !== null) {
      updateIngredient(selectedIngredientIndex, 'name', suggestion);
      setShowSuggestions(false);
    }
  };

  const renderIngredientRow = (ingredient: Ingredient, index: number) => (
    <View key={index} style={styles.ingredientRow}>
      <View style={styles.amountContainer}>
        <TextInput
          ref={ref => amountRefs.current[index] = ref}
          style={[styles.input, styles.amountInput]}
          value={ingredient.amount}
          onChangeText={(value) => {
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
              updateIngredient(index, 'amount', value);
            }
          }}
          placeholder="Qty"
          placeholderTextColor="#666"
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => unitRefs.current[index]?.focus()}
        />
        {ingredient.amount ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => clearIngredientField(index, 'amount')}
          >
            <ThemedText style={styles.clearButtonText}>×</ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.unitContainer}>
        <TouchableOpacity
          style={[styles.input, styles.unitInput]}
          onPress={() => {
            setSelectedIngredientIndex(index);
            setShowUnitPicker(true);
          }}
        >
          <ThemedText style={ingredient.unit ? styles.unitText : styles.placeholderText}>
            {ingredient.unit || 'Unit'}
          </ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles.nameContainer}>
        <View ref={ref => nameInputRefs.current[index] = ref}>
          <TextInput
            ref={ref => nameRefs.current[index] = ref}
            style={[styles.input, styles.ingredientNameInput]}
            value={ingredient.name}
            onChangeText={(value) => handleIngredientNameChange(index, value)}
            placeholder="Name"
            placeholderTextColor="#666"
            returnKeyType="next"
            onSubmitEditing={() => {
              if (index === ingredients.length - 1) {
                addIngredient();
              } else {
                amountRefs.current[index + 1]?.focus();
              }
            }}
          />
          {ingredient.name ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => clearIngredientField(index, 'name')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ThemedText style={styles.clearButtonText}>×</ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeIngredient(index)}
      >
        <ThemedText style={styles.removeButtonText}>×</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <ThemedText type="title">{id ? 'Edit Recipe' : 'Add Recipe'}</ThemedText>
          
          <View style={styles.inputContainer}>
            <View style={styles.titleHeader}>
              <ThemedText type="subtitle">Title</ThemedText>
              <TouchableOpacity
                style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
                onPress={() => setIsFavorite(!isFavorite)}
              >
                <ThemedText style={[
                  styles.favoriteButtonText,
                  isFavorite && styles.favoriteButtonTextActive
                ]}>
                  {isFavorite ? '★ Favorite' : '☆ Favorite'}
                </ThemedText>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter recipe title"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText type="subtitle">Categories</ThemedText>
            <View style={styles.categoriesContainer}>
              {DEFAULT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategories.includes(category) && styles.categoryButtonSelected
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <ThemedText style={[
                    styles.categoryText,
                    selectedCategories.includes(category) && styles.categoryTextSelected
                  ]}>
                    {category}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.ingredientsHeader}>
              <ThemedText type="subtitle">Ingredients</ThemedText>
              <View style={styles.ingredientActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowCopyModal(true)}
                >
                  <ThemedText style={styles.actionButtonText}>Paste</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={copyIngredients}
                >
                  <ThemedText style={styles.actionButtonText}>Copy</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.ingredientsHeader}>
              <ThemedText style={[styles.headerText, { width: AMOUNT_WIDTH }]}>Qty</ThemedText>
              <ThemedText style={[styles.headerText, { width: UNIT_WIDTH }]}>Unit</ThemedText>
              <ThemedText style={[styles.headerText, { flex: 1 }]}>Ingredient</ThemedText>
            </View>
            {ingredients.map((ingredient, index) => renderIngredientRow(ingredient, index))}
            <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
              <ThemedText style={styles.addButtonText}>+ Add Ingredient</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText type="subtitle">Instructions</ThemedText>
            {instructions.map((instruction, index) => (
              <View key={index} style={styles.listItem}>
                <TextInput
                  style={[styles.input, styles.listInput]}
                  value={instruction}
                  onChangeText={(value) => updateInstruction(index, value)}
                  placeholder={`Step ${index + 1}`}
                  placeholderTextColor="#666"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeInstruction(index)}
                >
                  <ThemedText style={styles.removeButtonText}>×</ThemedText>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addInstruction}>
              <ThemedText style={styles.addButtonText}>+ Add Step</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle">Recipe Link (Optional)</ThemedText>
            <View style={styles.linkContainer}>
              <TextInput
                style={[styles.input, styles.linkInput]}
                value={videoLink}
                onChangeText={setVideoLink}
                placeholder="Paste recipe link, video URL, or website"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                }}
              />
              {videoLink ? (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setVideoLink('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ThemedText style={styles.clearButtonText}>×</ThemedText>
                </TouchableOpacity>
              ) : null}
            </View>
            <ThemedText style={styles.helperText}>
              Add a link to a recipe website, video tutorial, or any other helpful resource
            </ThemedText>
          </View>
        </ScrollView>

        <Modal
          visible={showUnitPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowUnitPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Select Unit</ThemedText>
                <TouchableOpacity
                  onPress={() => setShowUnitPicker(false)}
                  style={styles.closeButton}
                >
                  <ThemedText style={styles.closeButtonText}>×</ThemedText>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.unitList}>
                {DEFAULT_UNITS.map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={styles.unitOption}
                    onPress={() => selectUnit(unit)}
                  >
                    <ThemedText>{unit}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showCopyModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCopyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Paste Ingredients</ThemedText>
                <TouchableOpacity
                  onPress={() => setShowCopyModal(false)}
                  style={styles.closeButton}
                >
                  <ThemedText style={styles.closeButtonText}>×</ThemedText>
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <ThemedText style={styles.modalText}>
                  Paste your ingredients list. Each line will be treated as a separate ingredient.
                  The app will try to parse common formats like "2 cups flour" or "1/2 tsp salt".
                </ThemedText>
                <TouchableOpacity
                  style={styles.pasteButton}
                  onPress={handlePasteIngredients}
                >
                  <ThemedText style={styles.pasteButtonText}>Paste from Clipboard</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {showSuggestions && (
          <TouchableOpacity
            style={styles.suggestionsOverlay}
            activeOpacity={1}
            onPress={() => setShowSuggestions(false)}
          >
            <View style={[
              styles.suggestionsContent,
              {
                position: 'absolute',
                top: suggestionPosition.y,
                left: suggestionPosition.x,
                right: 20,
                maxHeight: 200,
                zIndex: 1000,
              }
            ]}>
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionOption}
                  onPress={() => selectSuggestion(suggestion)}
                >
                  <ThemedText>{suggestion}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <ThemedText style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Recipe'}
          </ThemedText>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
    paddingBottom: 160,
  },
  inputContainer: {
    marginTop: 24,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  amountContainer: {
    width: AMOUNT_WIDTH,
  },
  unitContainer: {
    width: UNIT_WIDTH,
  },
  nameContainer: {
    flex: 1,
  },
  amountInput: {
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  unitInput: {
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  ingredientNameInput: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  listInput: {
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#0a7ea4',
    fontSize: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
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
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextSelected: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  unitList: {
    maxHeight: 400,
  },
  unitOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  unitText: {
    color: '#000',
  },
  placeholderText: {
    color: '#666',
  },
  clearButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 14,
    textAlignVertical: 'center',
  },
  ingredientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#0a7ea4',
  },
  modalBody: {
    padding: 16,
    gap: 16,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  pasteButton: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  pasteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  suggestionsContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  section: {
    marginTop: 24,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkInput: {
    paddingRight: 40,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  titleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  favoriteButtonActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  favoriteButtonText: {
    fontSize: 14,
    color: '#666',
  },
  favoriteButtonTextActive: {
    color: 'white',
  },
}); 