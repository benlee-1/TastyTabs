import { useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

export default function EditRecipe() {
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';
  
  useEffect(() => {
    if (!id) {
      console.error('No recipe ID provided for editing');
      router.replace('/(tabs)');
      return;
    }
    
    // Use direct navigation to the add form without affecting tab state
    console.log('Navigating to add screen with ID:', id);
    
    // Directly replace to the add tab but with the proper params
    router.replace({
      pathname: '/(tabs)/add/new',
      params: { 
        id,
        edit: 'true', // Flag that we're in edit mode
        _t: Date.now().toString() // Ensure no caching issues
      }
    });
  }, [id]);
  
  return null; // This screen just redirects, so no UI needed
} 