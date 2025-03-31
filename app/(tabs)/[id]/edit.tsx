import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function EditRecipe() {
  const { id } = useLocalSearchParams();
  
  return (
    <View>
      <Text>Edit Recipe {id}</Text>
    </View>
  );
} 