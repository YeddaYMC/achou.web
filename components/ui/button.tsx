import { useTheme } from '@/hooks/useTheme';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

// Props do componente Button
interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

// Botão reutilizável com variantes
export function Button({ children, onPress, variant = 'default', style, textStyle, disabled = false }: ButtonProps) {
  const { colors, opacity } = useTheme(); // Tema

  const variantStyles = {
    default: { backgroundColor: colors.primary, textColor: colors.primaryForeground }, // Variante padrão
    outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.border, textColor: colors.foreground }, // Variante outline
    destructive: { backgroundColor: colors.destructive, textColor: colors.destructiveForeground }, // Variante destrutiva
    secondary: { backgroundColor: colors.secondary, textColor: colors.secondaryForeground }, // Variante secundária
  };

  const currentVariant = variantStyles[variant]; // Estilo atual

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: currentVariant.backgroundColor },
        'borderWidth' in currentVariant && { borderWidth: currentVariant.borderWidth, borderColor: currentVariant.borderColor },
        disabled && { opacity: opacity.disabled }, // Opacidade se desabilitado
        style,
      ]}
      activeOpacity={opacity.pressed} // Opacidade ao pressionar
    >
      {typeof children === 'string' ? (
        <Text style={[styles.text, { color: currentVariant.textColor }, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16, // Padding horizontal
    paddingVertical: 12, // Padding vertical
    borderRadius: 8, // Borda arredondada
    alignItems: 'center', // Centraliza conteúdo
    justifyContent: 'center', // Centraliza conteúdo
  },
  text: {
    fontSize: 16, // Tamanho fonte
    fontWeight: '600', // Peso médio
  },
});
