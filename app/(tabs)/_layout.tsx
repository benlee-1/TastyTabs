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
            // Force a reset of navigation and params
            router.push({
              pathname: '/(tabs)/add/new',
              params: { refresh: Date.now() }
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
        name="add/new"
        options={{
          title: 'Add Recipe',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
          tabBarButton: AddRecipeTabButton
        }}
      />
    </Tabs>
  );
}
