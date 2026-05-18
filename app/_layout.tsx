import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { AppProvider, useAppContext } from '../context/AppContext';
import RootNavigator from '../navigation/RootNavigator';

function AppLayout() {
  const { currentScreen, navigateTo } = useAppContext();

  useEffect(() => {
    // Redireciona para T1 após 10s se estiver na tela index
    if (currentScreen === 'index') {
      const timer = setTimeout(() => {
        navigateTo('T1');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, navigateTo]);

  return <RootNavigator />;
}

// Wrapper que usa HashRouter no web se disponível
function OptionalHashRouter({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  try {
    // require para evitar erro no bundler RN; roda só no web
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { HashRouter } = require('react-router-dom');
    // Forçar HashRouter com basename para GitHub Pages deploy em subpath
    return <HashRouter basename="/achou-web/">{children}</HashRouter>;
  } catch (e) {
    return <>{children}</>;
  }
}

export default function RootLayout() {
  return (
    <AppProvider>
      <OptionalHashRouter>
        <AppLayout />
      </OptionalHashRouter>
    </AppProvider>
  );
}
