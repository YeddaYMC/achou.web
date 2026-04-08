import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import Footer from './Footer';
import Header from './Header';

// Props do Layout
interface LayoutProps {
  children: ReactNode;
  style?: ViewStyle;
}

// Layout padrão com SafeArea e ScrollView
export default function LayoutRN({ children, style }: LayoutProps) {
  const { colors } = useTheme(); // Tema
  const { isDarkMode } = useAppContext();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? 'transparent' : colors.background }]}>
      {isDarkMode ? (
        <LinearGradient
          colors={['#0f172a', '#1e3a8a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      <View style={styles.container}>
        <Header />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, style]}
          showsVerticalScrollIndicator={false} // Esconde barra scroll
        >
          {children}
        </ScrollView>
        <Footer />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1, // Ocupa tela inteira
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1, // Permite crescimento
  },
});
