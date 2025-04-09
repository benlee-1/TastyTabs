import { Tabs, router } from 'expo-router';
import React, { useCallback } from 'react';
import { Platform, TouchableOpacity } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Custom tab button for Add Recipe that ensures a fresh form
  const AddRecipeTabButton = useCallback(
    (props: any) => {
      return (
        <HapticTab
          {...props}
          onPress={() => {
            // Force a completely new navigation to reset all state
            // Use a unique timestamp to ensure the form is always fresh
            router.navigate({
              pathname: '/(tabs)/add/new',
              params: { 
                refresh: Date.now().toString(),
                forceNew: 'true', // Special flag to force a new form
              }
            });
          }}
        />
      );
    },
    []
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Recipe',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
          tabBarButton: AddRecipeTabButton
        }}
      />
      {/* Hide the dynamic route tabs */}
      <Tabs.Screen
        name="[id]"
        options={{
          title: 'Recipe Details',
          href: null,
          // This completely removes the tab item from the tab bar
          tabBarItemStyle: { display: 'none' }
        }}
      />
      
      {/* Hide the edit route */}
      <Tabs.Screen
        name="edit/[id]"
        options={{
          title: 'Edit Recipe',
          href: null,
          // This completely removes the tab item from the tab bar
          tabBarItemStyle: { display: 'none' }
        }}
      />
    </Tabs>
  );
}
