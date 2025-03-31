import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';

export function AppIcon() {
  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <ThemedText style={styles.text}>T</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 1024,
    height: 1024,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    width: 800,
    height: 800,
    borderRadius: 200,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontSize: 400,
    fontWeight: 'bold',
    color: '#ffffff',
  },
}); 