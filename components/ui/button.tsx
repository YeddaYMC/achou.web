import { useTheme } from '@/hooks/useTheme';
import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

// Props do componente Button
interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'success' | 'cancel';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

// Botão reutilizável com variantes
export function Button({ children, onPress, variant = 'default', style, textStyle, disabled = false }: ButtonProps) {
  const { colors, opacity } = useTheme(); // Tema

  const variantStyles = {
    default: { backgroundColor: colors.primary, textColor: colors.primaryForeground }, // Variante padrão
    outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.border, textColor: colors.foreground }, // Variante outline
    destructive: { backgroundColor: colors.delete || colors.destructive, textColor: colors.deleteForeground || colors.destructiveForeground }, // Variante destrutiva
    secondary: { backgroundColor: colors.secondary, textColor: colors.secondaryForeground }, // Variante secundária
    success: { backgroundColor: colors.success, textColor: colors.successForeground }, // Variante sucesso (verde)
    cancel: { backgroundColor: colors.cancel, textColor: colors.cancelForeground }, // Variante cancelar (cinza)
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
    minHeight: 46, // Evita corte de texto em Android/Expo Go
    borderRadius: 8, // Borda arredondada
    alignItems: 'center', // Centraliza conteúdo
    justifyContent: 'center', // Centraliza conteúdo
  },
  text: {
    fontSize: 16, // Tamanho fonte
    fontWeight: '600', // Peso médio
    lineHeight: 20,
  },
});
