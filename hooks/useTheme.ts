import { theme as baseTheme, colors } from '@/styles/theme';
import { useColorScheme } from 'react-native';

// Hook para acessar tema baseado no esquema de cores do dispositivo
export function useTheme() {
  const colorScheme = useColorScheme(); // Obtém esquema (light/dark)
  const isDark = colorScheme === 'dark'; // Verifica se é dark
  
  return {
    colors: isDark ? colors.dark : colors.light, // Cores do tema
    ...baseTheme, // Outros tokens (spacing, fontSize, etc)
    isDark, // Flag dark mode
    colorScheme, // Esquema atual
  };
}
