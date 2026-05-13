import { useTheme } from '@/hooks/useTheme';
import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

// Props do componente Label
interface LabelProps {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}

// Label para campos de formulário
export function Label({ children, style }: LabelProps) {
  const { colors } = useTheme(); // Tema

  return <Text style={[styles.label, { color: colors.foreground }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14, // Tamanho fonte
    fontWeight: '600', // Peso médio
    marginBottom: 4, // Espaço inferior
  },
});
