import { useTheme } from '@/hooks/useTheme';
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

// Props do componente Card
interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
}

// Card para exibir conteúdo em container elevado
export function Card({ children, style }: CardProps) {
  const { colors, shadows } = useTheme(); // Tema

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12, // Borda arredondada
    borderWidth: 1, // Borda fina
    overflow: 'hidden', // Conteúdo não vaza
  },
});
