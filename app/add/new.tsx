import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

export default function AddRecipeRedirector() {
  const params = useLocalSearchParams();
  
  useEffect(() => {
    // Handle the redirect to the actual add form
    console.log("ROOT Redirector params:", params);
    
    // Simple redirect without setTimeout
    router.replace({
      pathname: '/(tabs)/add/new',
      params: {...params}
    });
  }, [params]);
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Recipe', headerShown: true }} />
      <ActivityIndicator size="large" color="#0a7ea4" style={styles.spinner} />
      <Text style={styles.loadingText}>Loading...</Text>
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
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  }
}); 