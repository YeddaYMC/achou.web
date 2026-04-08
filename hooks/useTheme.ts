import { theme as baseTheme, colors } from '@/styles/theme';
import { useColorScheme } from 'react-native';
import { useAppContext } from '../context/AppContext';

// Hook para acessar tema baseado no esquema de cores do dispositivo
export function useTheme() {
  const colorScheme = useColorScheme(); // Obtém esquema (light/dark)

  // Prioriza o tema definido no app; se não houver provider, usa esquema do dispositivo.
  let appIsDarkMode: boolean | undefined;
  try {
    appIsDarkMode = useAppContext().isDarkMode;
  } catch {
    appIsDarkMode = undefined;
  }

  const isDark = typeof appIsDarkMode === 'boolean' ? appIsDarkMode : colorScheme === 'dark';
  
  return {
    colors: isDark ? colors.dark : colors.light, // Cores do tema
    ...baseTheme, // Outros tokens (spacing, fontSize, etc)
    isDark, // Flag dark mode
    colorScheme, // Esquema atual
  };
}
