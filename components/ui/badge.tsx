import { useTheme } from '@/hooks/useTheme';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

// Props do componente Badge
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  style?: ViewStyle;
}

// Badge para categorias e tags
export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const { colors } = useTheme(); // Cores do tema

  const variantStyles = {
    default: { backgroundColor: colors.primary, color: colors.primaryForeground }, // Variante padrão
    secondary: { backgroundColor: colors.secondary, color: colors.secondaryForeground }, // Variante secundária
    destructive: { backgroundColor: colors.destructive, color: colors.destructiveForeground }, // Variante destrutiva
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border, color: colors.foreground }, // Variante outline
  };

  const currentVariant = variantStyles[variant]; // Estilo da variante

  return (
    <View style={[styles.badge, { backgroundColor: currentVariant.backgroundColor }, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, { color: currentVariant.color }]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
