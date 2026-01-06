import { useAppContext } from '@/context/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const { navigateTo } = useAppContext();
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigateTo('T1');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigateTo]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>ACHOU</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563EB',
  },
});
