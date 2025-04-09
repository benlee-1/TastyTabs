import React, { useEffect } from 'react';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
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
    
    // Direct navigation to add/new with the recipe ID
    console.log('Navigating to add screen with ID:', id);
    
    // Use a more reliable navigation approach
    router.replace({
      pathname: '/(tabs)/add/new', // Keep within tabs to avoid navigation issues
      params: { 
        id,
        edit: 'true',
        _t: Date.now().toString()
      }
    });
  }, [id]);
  
  // Show a loading screen during the redirect
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Edit Recipe', headerShown: true }} />
      <ActivityIndicator size="large" color="#0a7ea4" style={styles.loader} />
      <Text style={styles.loadingText}>Loading recipe...</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  }
}); 