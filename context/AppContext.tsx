import { getAuth } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import app from '../firebaseConfig';
import { mockBusinesses } from '../mockData/mockBusinesses';
import { getAllActiveAnuncios } from '../src/services/anuncioService';
import { addFavorite, getFavorites, getUserProfile, removeFavorite, subscribeToAuthState } from '../src/services/authService';

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
  entregaRapida?: boolean; // Tag para entrega rápida na região
  contactVisibility?: {
    instagram?: boolean;
    facebook?: boolean;
    pinterest?: boolean;
  };
}

// Tipo para usuário
interface UserProfile {
  name: string;
  nickname?: string;
  email: string;
  password?: string;
  phone: string;
  cpf: string;
  anuncianteLevel: 1 | 2 | 3 | 4;
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
          // Buscar perfil do usuário
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setUserProfile(profile as UserProfile);
            setIsLoggedIn(true);
          }
          
          // Buscar favoritos do usuário
          const userFavorites = await getFavorites(firebaseUser.uid);
          setFavorites(userFavorites);
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          setIsLoggedIn(false);
          setUserProfile(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
        setFavorites([]);
      }
    });

    return () => unsubscribe?.(); // Cleanup
  }, []);

  // Carrega anúncios do Firestore ao iniciar
  useEffect(() => {
    const carregarAnuncios = async () => {
      try {
        console.log('📡 Buscando anúncios do Firestore...');
        const anuncios = await getAllActiveAnuncios();
        
        if (anuncios.length > 0) {
          console.log(`✅ ${anuncios.length} anúncio(s) encontrado(s)`);
          // Converter anúncios para formato de Business
          const businesses = anuncios.map(anuncio => ({
            id: parseInt(anuncio.id?.substring(0, 10) || Math.random().toString()) || Math.random(),
            name: anuncio.name,
            categories: [anuncio.category],
            location: anuncio.location,
            cep: anuncio.cep,
            phone: anuncio.phone,
            whatsapp: anuncio.whatsapp,
            description: anuncio.description,
            image: anuncio.fotos?.[0] || null,
            lat: 0,
            lon: 0,
            instagram: anuncio.instagram,
            facebook: anuncio.facebook,
            pinterest: anuncio.pinterest,
            entregaRapida: anuncio.entregaRapida,
            contactVisibility: anuncio.contactVisibility,
          }));
          setBusinesses(businesses);
        } else {
          console.log('⚠️ Nenhum anúncio encontrado, usando dados de teste');
          setBusinesses(mockBusinesses);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar anúncios:', error);
        console.log('📚 Usando dados de teste como fallback');
        setBusinesses(mockBusinesses);
      }
    };

    if (businesses.length === 0) {
      carregarAnuncios();
    }
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

  // Toggle de favorito (sincroniza com Firebase)
  const toggleFavorite = (id: number) => {
    console.log('=== TOGGLE FAVORITO START ===');
    console.log('ID:', id);
    console.log('isLoggedIn:', isLoggedIn);
    console.log('userProfile:', userProfile?.name);
    
    const isFavorite = (favorites || []).includes(id);
    console.log('isFavorite (antes):', isFavorite);
    
    // Atualizar estado local PRIMEIRO
    const newFavorites = isFavorite
      ? (favorites || []).filter((fav) => fav !== id)
      : [...(favorites || []), id];
    
    console.log('newFavorites:', newFavorites);
    setFavorites(newFavorites);

    // Sincronizar com Firebase se logado
    if (isLoggedIn) {
      console.log('Iniciando sincronização com Firebase...');
      const syncFavorite = async () => {
        try {
          const auth = getAuth(app);
          const currentUser = auth.currentUser;
          
          console.log('currentUser.uid:', currentUser?.uid);
          
          if (currentUser?.uid) {
            console.log('Acionando', isFavorite ? 'removeFavorite' : 'addFavorite', 'para ID:', id);
            
            if (isFavorite) {
              const result = await removeFavorite(currentUser.uid, id);
              console.log('removeFavorite resultado:', result);
            } else {
              const result = await addFavorite(currentUser.uid, id);
              console.log('addFavorite resultado:', result);
            }
            console.log('Sincronização concluída com sucesso!');
          } else {
            console.warn('⚠️ currentUser.uid não encontrado!');
          }
        } catch (error) {
          console.error('❌ Erro ao sincronizar favorito:', error);
        }
        console.log('=== TOGGLE FAVORITO END ===');
      };
      
      // Executar imediatamente sem delay
      syncFavorite();
    } else {
      console.warn('⚠️ Usuário não está logado!');
      console.log('=== TOGGLE FAVORITO END ===');
    }
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
