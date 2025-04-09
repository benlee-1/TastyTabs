import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

export default function AddRecipeRedirector() {
  const params = useLocalSearchParams();
  
  useEffect(() => {
    // Handle the redirect to the actual add form
    // while maintaining all parameters
    console.log("ROOT Redirector params:", params);
    
    const queryParams = {...params};
    
    // Small delay to ensure the navigation works properly
    setTimeout(() => {
      router.replace({
        pathname: '/(tabs)/add/new',
        params: queryParams
      });
    }, 50);
  }, [params]);
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ActivityIndicator size="large" color="#0a7ea4" />
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
}); 