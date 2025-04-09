import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TextInput, ScrollView, View, Text, TouchableOpacity, SafeAreaView, Platform, Modal, Pressable, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { saveRecipe, updateRecipe, getRecipeById, initDatabase } from '@/app/services/db';
import { Picker } from '@react-native-picker/picker';
import { DEFAULT_UNITS, DEFAULT_CATEGORIES } from '@/app/types/Recipe';

export default function AddRecipe() {
  const params = useLocalSearchParams();
  const editId = typeof params.id === 'string' ? params.id : undefined;
  const refresh = params.refresh; // Use this to detect when we want to force a refresh
  
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState<Array<{name: string; amount: string; unit: string}>>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [videoLink, setVideoLink] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Current input states
  const [currentIngredient, setCurrentIngredient] = useState({
    name: '',
    amount: '',
    unit: 'piece'
  });
  const [currentInstruction, setCurrentInstruction] = useState('');

  // Clear all form fields
  const clearForm = useCallback(() => {
    setTitle('');
    setIngredients([]);
    setInstructions([]);
    setVideoLink('');
    setSelectedCategories([]);
    setCurrentIngredient({ name: '', amount: '', unit: 'piece' });
    setCurrentInstruction('');
    setIsFavorite(false);
  }, []);

  // Effect to handle form initialization or refresh
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        
        // Always clear form first
        clearForm();
        
        // Then load recipe data if editing
        if (editId) {
          const recipe = await getRecipeById(editId);
          if (recipe) {
            setTitle(recipe.title);
            setIngredients(recipe.ingredients);
            setInstructions(recipe.instructions);
            setVideoLink(recipe.videoLink || '');
            setSelectedCategories(recipe.categories);
            setIsFavorite(recipe.isFavorite);
          }
        }
      } catch (error) {
        console.error('Error initializing:', error);
      }
    };
    
    // Initialize the form
    init();

    return () => {
      // Cleanup on unmount
      clearForm();
    };
  }, [editId, clearForm, refresh]); // Add refresh to dependencies

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const renderUnitSelector = () => {
    if (Platform.OS === 'ios') {
      return (
        <>
          <Pressable
            style={[styles.input, styles.unitSelector]}
            onPress={() => setShowUnitPicker(true)}
          >
            <Text style={styles.unitText}>{currentIngredient.unit}</Text>
          </Pressable>
          <Modal
            animationType="slide"
            transparent={true}
            visible={showUnitPicker}
            onRequestClose={() => setShowUnitPicker(false)}
          >
            <Pressable 
              style={styles.modalOverlay}
              onPress={() => setShowUnitPicker(false)}
            >
              <View style={styles.modalView}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity 
                    style={styles.doneButton} 
                    onPress={() => setShowUnitPicker(false)}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={currentIngredient.unit}
                  onValueChange={(value: string) => {
                    setCurrentIngredient({...currentIngredient, unit: value});
                  }}
                >
                  {DEFAULT_UNITS.map((unit) => (
                    <Picker.Item key={unit} label={unit} value={unit} />
                  ))}
                </Picker>
              </View>
            </Pressable>
          </Modal>
        </>
      );
    }

    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={currentIngredient.unit}
          onValueChange={(value: string) => setCurrentIngredient({...currentIngredient, unit: value})}
          style={styles.picker}
        >
          {DEFAULT_UNITS.map((unit) => (
            <Picker.Item key={unit} label={unit} value={unit} />
          ))}
        </Picker>
      </View>
    );
  };

  const addIngredient = () => {
    if (!currentIngredient.name.trim() || !currentIngredient.amount.trim()) {
      Alert.alert('Error', 'Please fill in both name and amount for the ingredient');
      return;
    }

    setIngredients([...ingredients, { 
      ...currentIngredient,
      name: currentIngredient.name.trim(),
      amount: currentIngredient.amount.trim()
    }]);
    setCurrentIngredient({ name: '', amount: '', unit: 'piece' });
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    if (!currentInstruction.trim()) {
      Alert.alert('Error', 'Please enter an instruction step');
      return;
    }

    setInstructions([...instructions, currentInstruction.trim()]);
    setCurrentInstruction('');
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const generateUniqueId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `recipe_${timestamp}_${random}`;
  };

  const handleSaveRecipe = async () => {
    // Validate required fields
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }

    if (ingredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    if (instructions.length === 0) {
      Alert.alert('Error', 'Please add at least one instruction step');
      return;
    }

    try {
      const currentTime = Date.now();
      const newId = generateUniqueId();
      
      // If editing, verify the recipe still exists
      if (editId) {
        const existingRecipe = await getRecipeById(editId);
        if (!existingRecipe) {
          Alert.alert('Error', 'Recipe no longer exists');
          router.replace('/(tabs)');
          return;
        }
      }

      const recipeData = {
        id: editId || newId,
        title: title.trim(),
        ingredients,
        instructions,
        videoLink,
        createdAt: currentTime,
        categories: selectedCategories,
        isFavorite: editId ? isFavorite : false
      };

      if (editId) {
        await updateRecipe(recipeData);
        // Clear form after saving (important!)
        clearForm();
        // Navigate to the recipe detail
        router.replace(`/(tabs)/${editId}`);
      } else {
        await saveRecipe(recipeData);
        // Clear form after saving
        clearForm();
        // Navigate to the recipe list
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.sectionTitle, styles.firstSection]}>
          {editId ? 'Edit Recipe' : 'New Recipe'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter recipe title"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesContainer}>
          {DEFAULT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTag,
                selectedCategories.includes(category) && styles.categoryTagSelected
              ]}
              onPress={() => toggleCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategories.includes(category) && styles.categoryTextSelected
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.ingredientName]}
            placeholder="Name"
            value={currentIngredient.name}
            onChangeText={(text) => setCurrentIngredient({...currentIngredient, name: text})}
          />
          <TextInput
            style={[styles.input, styles.ingredientAmount]}
            placeholder="#"
            value={currentIngredient.amount}
            onChangeText={(text) => setCurrentIngredient({...currentIngredient, amount: text})}
            keyboardType="numeric"
          />
          {renderUnitSelector()}
          <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listItemText}>
              {ingredient.amount} {ingredient.unit} {ingredient.name}
            </Text>
            <TouchableOpacity onPress={() => removeIngredient(index)}>
              <Text style={styles.removeButton}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Instructions</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.instructionInput]}
            placeholder="Enter instruction step"
            value={currentInstruction}
            onChangeText={setCurrentInstruction}
          />
          <TouchableOpacity style={styles.addButton} onPress={addInstruction}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {instructions.map((instruction, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listItemText}>{index + 1}. {instruction}</Text>
            <TouchableOpacity onPress={() => removeInstruction(index)}>
              <Text style={styles.removeButton}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Video Link (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter video URL"
          value={videoLink}
          onChangeText={setVideoLink}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveRecipe}>
          <Text style={styles.saveButtonText}>Save Recipe</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 32,
    paddingBottom: 100,
  },
  firstSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 24,
    color: '#000',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    height: 54,
  },
  ingredientName: {
    flex: 2,
    minWidth: 120,
  },
  ingredientAmount: {
    flex: 1,
    minWidth: 70,
  },
  instructionInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '400',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 8,
  },
  listItemText: {
    fontSize: 16,
    flex: 1,
  },
  removeButton: {
    color: '#ff4444',
    fontSize: 24,
    padding: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  unitSelector: {
    flex: 1,
    minWidth: 90,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  unitText: {
    fontSize: 16,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  doneButton: {
    padding: 16,
  },
  doneButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    flex: 1,
    minWidth: 90,
    height: 44,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryTagSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextSelected: {
    color: '#fff',
  },
}); 