import { Stack } from 'expo-router';
import React from 'react';

export default function AddRecipeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ redirect: true }} />
      <Stack.Screen name="new" />
    </Stack>
  );
} 