import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getUserProfile, subscribeToAuthState } from '../src/services/authService';

// Tipo para negócio
interface Business {
  id: number;
  name: string;
  categories: string[]; // Array de categorias (múltiplas)
  location: string;
  cep: string;
  phone: string;
  whatsapp: string;
  description: string;
  image: any;
  lat: number;
  lon: number;
  instagram?: string;
  facebook?: string;
  pinterest?: string;
  contactVisibility?: {
    instagram?: boolean;
    facebook?: boolean;
    pinterest?: boolean;
  };
}

// Tipo para usuário
interface UserProfile {
  name: string;
  email: string;
  password?: string;
  phone: string;
  cpf: string;
  isPremium: boolean;
  createdAt: string;
}

// Tipo para contexto
interface AppContextType {
  navigateTo: (screen: string) => void; // Navegar para tela
  navigateBack: () => void; // Voltar para tela anterior
  currentScreen: string; // Tela atual
  setSelectedBusiness: (business: Business | null) => void; // Define negócio selecionado
  selectedBusiness: Business | null; // Negócio selecionado
  favorites: number[]; // Lista de favoritos
  setFavorites: (favorites: number[]) => void; // Define favoritos
  toggleFavorite: (id: number) => void; // Adiciona/remove favorito
  isDarkMode: boolean; // Modo escuro ativo
  setIsDarkMode: (value: boolean) => void; // Define modo escuro
  isLoggedIn: boolean; // Usuário logado
  setIsLoggedIn: (value: boolean) => void; // Define estado login
  userProfile: UserProfile | null; // Perfil do usuário
  setUserProfile: (profile: UserProfile | null) => void; // Define perfil
  registeredUsers: UserProfile[]; // Lista usuários registrados
  setRegisteredUsers: (users: UserProfile[]) => void; // Define lista usuários
  returnTo: string | null; // Tela para retornar após login
  setReturnTo: (screen: string | null) => void; // Define tela de retorno
  validateLogin: (email: string, password: string) => { success: boolean; user?: UserProfile }; // Valida credenciais
  locationSettings: any; // Configurações de localização
  setLocationSettings: (settings: any) => void; // Define configurações de localização
  businesses: Business[]; // Lista de negócios
  setBusinesses: (businesses: Business[]) => void; // Define lista de negócios
  reportBusiness: { id: number; name: string } | null; // Negócio para reportar
  setReportBusiness: (business: { id: number; name: string } | null) => void; // Define negócio para reportar
  showUpdateProfileDialog: boolean; // Exibir dialog de atualização de perfil
  setShowUpdateProfileDialog: (show: boolean) => void; // Define estado do dialog
}

// Contexto
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider do contexto
export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState('index'); // Tela atual
  const [screenHistory, setScreenHistory] = useState<string[]>([]); // Histórico navegação
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null); // Negócio selecionado
  const [favorites, setFavorites] = useState<number[]>([]); // Lista de favoritos
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Estado login
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Perfil usuário
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]); // Usuários registrados
  const [returnTo, setReturnTo] = useState<string | null>(null); // Tela de retorno após login
  const [locationSettings, setLocationSettings] = useState<any>(null); // Configurações de localização
  const [businesses, setBusinesses] = useState<Business[]>([]); // Lista de negócios
  const [reportBusiness, setReportBusiness] = useState<{ id: number; name: string } | null>(null); // Negócio para reportar
  const [showUpdateProfileDialog, setShowUpdateProfileDialog] = useState(false); // Dialog atualização perfil
  const [isDarkMode, setIsDarkMode] = useState(false); // Modo escuro
  const colorScheme = useColorScheme(); // Esquema de cores do dispositivo

  // Sincroniza com Firebase Auth State
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setUserProfile(profile as UserProfile);
            setIsLoggedIn(true);
          }
        } catch (error) {
          console.error('Erro ao buscar perfil:', error);
          setIsLoggedIn(false);
          setUserProfile(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    });

    return () => unsubscribe?.(); // Cleanup
  }, []);

  // Função de navegação
  const navigateTo = (screen: string) => {
    setScreenHistory((prev) => [...prev, currentScreen]); // Adiciona tela ao histórico
    setCurrentScreen(screen); // Atualiza tela atual
  };

  // Volta tela anterior
  const navigateBack = () => {
    if (screenHistory.length > 0) {
      const previous = screenHistory[screenHistory.length - 1]; // Pega última tela
      setScreenHistory((prev) => prev.slice(0, -1)); // Remove do histórico
      setCurrentScreen(previous); // Volta para tela anterior
    }
  };

  // Toggle de favorito
  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id] // Adiciona ou remove
    );
  };

  // Valida credenciais de login
  const validateLogin = (email: string, password: string) => {
    const user = registeredUsers.find((u) => u.email === email && u.password === password); // Busca usuário
    if (user) {
      return { success: true, user }; // Retorna sucesso e usuário
    }
    return { success: false }; // Retorna falha
  };

  return (
    <AppContext.Provider
      value={{
        navigateTo,
        navigateBack,
        currentScreen,
        setSelectedBusiness,
        selectedBusiness,
        favorites,
        setFavorites,
        toggleFavorite,
        isDarkMode,
        setIsDarkMode,
        isLoggedIn,
        setIsLoggedIn,
        userProfile,
        setUserProfile,
        registeredUsers,
        setRegisteredUsers,
        returnTo,
        setReturnTo,
        validateLogin,
        locationSettings,
        setLocationSettings,
        businesses,
        setBusinesses,
        reportBusiness,
        setReportBusiness,
        showUpdateProfileDialog,
        setShowUpdateProfileDialog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Hook para usar o contexto
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext deve ser usado dentro de AppProvider'); // Erro se usado fora do provider
  }
  return context;
}
