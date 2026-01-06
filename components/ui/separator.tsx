import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

// Props do Separator
interface SeparatorProps {
  style?: ViewStyle;
}

// Linha separadora horizontal
export function Separator({ style }: SeparatorProps) {
  const { colors } = useTheme(); // Tema

  return (
    <View
      style={[
        styles.separator,
        { backgroundColor: colors.border }, // Cor da borda
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    height: 1, // Altura linha
    width: '100%', // Largura total
  },
});
