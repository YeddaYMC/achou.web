import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, TextStyle } from 'react-native';

// Props do Input
interface InputProps extends TextInputProps {
  style?: TextStyle;
}

// Input de texto reutilizável
export function Input({ style, ...props }: InputProps) {
  const { colors, borderRadius, spacing } = useTheme(); // Tema

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: colors.inputBackground, // Fundo input
          borderColor: colors.border, // Cor borda
          borderRadius: borderRadius.md, // Borda arredondada
          color: colors.foreground, // Cor texto
          paddingHorizontal: spacing.md, // Padding horizontal
        },
        style,
      ]}
      placeholderTextColor={colors.mutedForeground} // Cor placeholder
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48, // Altura padrão
    borderWidth: 1, // Borda
    fontSize: 14, // Tamanho fonte
  },
});
