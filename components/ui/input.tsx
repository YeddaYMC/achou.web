import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { Platform, StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle } from 'react-native';

// Props do Input
interface InputProps extends TextInputProps {
  style?: StyleProp<TextStyle>;
  // atributos opcionais úteis para web accessibility/autocomplete
  name?: string;
  id?: string;
}

// Input de texto reutilizável
export function Input({ style, name, id, ...props }: InputProps) {
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
      // Em web, expor `name` e `id` para ajudar autocompletar e acessibilidade
      {...(Platform.OS === 'web' ? ({ name, id } as any) : {})}
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
