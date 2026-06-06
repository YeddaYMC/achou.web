import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { AppProvider, useAppContext } from '../context/AppContext';
import RootNavigator from '../navigation/RootNavigator';

function AppLayout() {
  const { currentScreen, navigateTo } = useAppContext();

  useEffect(() => {
    if (currentScreen === 'index') {
      const timer = setTimeout(() => {
        navigateTo('T1');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, navigateTo]);

  return <RootNavigator />;
}

// Wrapper que usa HashRouter no web se disponível (com correção para Hydration Error)
function OptionalHashRouter({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Enquanto estiver renderizando no servidor (build), retorna a estrutura padrão
  if (!isMounted) return <>{children}</>;

  if (Platform.OS !== 'web') return <>{children}</>;

  try {
    const { HashRouter } = require('react-router-dom');
    // Removido o basename antigo porque a Cloudflare Pages roda na raiz do domínio
    return <HashRouter>{children}</HashRouter>;
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
