import { theme as baseTheme, colors } from '@/styles/theme';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useAppContext } from '../context/AppContext';

// Hook para acessar tema baseado no esquema de cores do dispositivo
// Evita usar o resultado de `useColorScheme()` diretamente no primeiro render
// para não causar descompasso de hidratação entre server/client.
export function useTheme() {
  const colorScheme = useColorScheme(); // Obtém esquema (light/dark)

  // Prioriza o tema definido no app; se não houver provider, usa esquema do dispositivo.
  let appIsDarkMode: boolean | undefined;
  try {
    appIsDarkMode = useAppContext().isDarkMode;
  } catch {
    appIsDarkMode = undefined;
  }

  // Inicialmente renderizamos um tema determinístico (light) quando não houver
  // valor explícito em contexto, para manter o mesmo HTML no server e no client
  // durante a hidratação. Depois atualizamos para o esquema real no client.
  const [isDark, setIsDark] = useState<boolean>(() => {
    return typeof appIsDarkMode === 'boolean' ? appIsDarkMode : false;
  });

  useEffect(() => {
    if (typeof appIsDarkMode === 'boolean') return; // app controla o tema
    setIsDark(colorScheme === 'dark');
  }, [colorScheme, appIsDarkMode]);

  return {
    colors: isDark ? colors.dark : colors.light, // Cores do tema
    ...baseTheme, // Outros tokens (spacing, fontSize, etc)
    isDark, // Flag dark mode
    colorScheme, // Esquema atual
  };
}
