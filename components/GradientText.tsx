import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

// Props do GradientText
interface GradientTextProps {
  children: ReactNode;
  colors?: string[]; // Cores do gradiente
  style?: ViewStyle;
}

// Componente de texto com gradiente (simplificado para RN)
export default function GradientText({ children, colors = ['#0ea5e9', '#6366f1', '#8b5cf6'], style }: GradientTextProps) {
  return (
    <LinearGradient
      colors={colors} // Cores do gradiente
      start={{ x: 0, y: 0 }} // Início gradiente
      end={{ x: 1, y: 0 }} // Fim gradiente
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 8, // Borda arredondada
    paddingHorizontal: 12, // Padding horizontal
    paddingVertical: 8, // Padding vertical
  },
});
