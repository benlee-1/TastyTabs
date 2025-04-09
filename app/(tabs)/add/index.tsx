import { Redirect, useLocalSearchParams } from 'expo-router';

export default function AddRecipeIndex() {
  // This is a redirect page to ensure proper navigation
  // when the tab is selected or when navigating to /add without /new
  const params = useLocalSearchParams();
  
  return (
    <Redirect 
      href={{
        pathname: "/(tabs)/add/new",
        params: {
          ...params,
          refresh: Date.now().toString()
        }
      }} 
    />
  );
} 