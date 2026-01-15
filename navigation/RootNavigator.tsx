import React from 'react';
import { useAppContext } from '../context/AppContext';
import T1TelaInicial from '../screens/t1-tela-inicial';
import T10Contato from '../screens/t10-contato';
import T11Termo from '../screens/t11-termos-condicoes';
import T2Cadastro from '../screens/t2-cadastro';
import T3Login from '../screens/t3-login';
import T4DetalhesNegocio from '../screens/t4-detalhes-negocio';
import T5Perfil from '../screens/t5-perfil';
import T6CriacaoEdicao from '../screens/t6-criacao-edicao-negocio';
import T7PainelGestao from '../screens/t7-painel-gestao';
import T8Politicas from '../screens/t8-politicas-termos';
import T9Favoritos from '../screens/t9-favoritos';

// Navegador raiz baseado em currentScreen do contexto
export default function RootNavigator() {
  const { currentScreen, isLoggedIn, setReturnTo } = useAppContext();

  // Redireciona para login armazenando tela de destino
  const redirectToLogin = (intendedScreen: string) => {
    setReturnTo(intendedScreen);
    return <T3Login />;
  };

  // Switch de telas baseado em currentScreen
  switch (currentScreen) {
    case 'index':
      return <T1TelaInicial />;
    case 'T1':
      return <T1TelaInicial />;
    case 'T2':
      return <T2Cadastro />;
    case 'T3':
      return <T3Login />;
    case 'T4':
      return <T4DetalhesNegocio />;
    case 'T5':
      return isLoggedIn ? <T5Perfil /> : redirectToLogin('T5');
    case 'T6':
      return isLoggedIn ? <T6CriacaoEdicao /> : redirectToLogin('T6');
    case 'T7':
      return isLoggedIn ? <T7PainelGestao /> : redirectToLogin('T7');
    case 'T8':
      return <T8Politicas />;
    case 'T9':
      return <T9Favoritos />;
    case 'T10':
      return <T10Contato />;
    case 'T11':
      return <T11Termo />;
    case 'T12':
      return isLoggedIn ? <T12Planos /> : redirectToLogin('T12');
    case 'planos':
      return isLoggedIn ? <T12Planos /> : redirectToLogin('T12');
    default:
      return <T1TelaInicial />;
  }
}
