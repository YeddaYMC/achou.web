import { useTheme } from '@/hooks/useTheme';
import { Check } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

// Props do Checkbox
interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  style?: ViewStyle;
}

// Checkbox reutilizável
export function Checkbox({ checked, onCheckedChange, style }: CheckboxProps) {
  const { colors, borderRadius } = useTheme(); // Tema

  return (
    <TouchableOpacity
      onPress={() => onCheckedChange(!checked)} // Toggle checked
      style={[
        styles.checkbox,
        {
          borderColor: colors.border, // Cor borda
          borderRadius: borderRadius.sm, // Borda arredondada
          backgroundColor: checked ? colors.primary : 'transparent', // Fundo se checked
        },
        style,
      ]}
      activeOpacity={0.7}
    >
      {checked && <Check size={16} color={colors.primaryForeground} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 24, // Largura
    height: 24, // Altura
    borderWidth: 2, // Borda
    justifyContent: 'center', // Centraliza
    alignItems: 'center', // Centraliza
  },
});
