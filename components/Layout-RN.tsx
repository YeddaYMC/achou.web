import { useTheme } from '@/hooks/useTheme';
import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
