import { useEffect } from 'react';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function EditRecipeRoute() {
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
    
    // Use the universal linking format to avoid tab highlighting
    setTimeout(() => {
      router.replace({
        pathname: '/add/new', // Use root path to avoid tab highlighting
        params: { 
          id,
          edit: 'true', // Flag that we're in edit mode
          isRootNavigated: 'true', // Special flag for navigation
          _t: Date.now().toString() // Ensure no caching issues
        }
      });
    }, 10);
  }, [id]);
  
  // Show a minimal loading screen during the redirect
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Edit Recipe', headerShown: false }} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 