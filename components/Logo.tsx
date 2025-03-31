import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';

interface LogoProps {
  size?: number;
  color?: string;
}

export function Logo({ size = 40, color = '#0a7ea4' }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <ThemedText style={[styles.text, { color }]}>T</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
}); 