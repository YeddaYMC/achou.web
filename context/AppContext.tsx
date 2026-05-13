import { getAuth } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import app from '../firebaseConfig';
import { mockBusinesses } from '../mockData/mockBusinesses';
import { getAllActiveAnuncios } from '../src/services/anuncioService';
import { addFavorite, getFavorites, getUserProfile, removeFavorite, subscribeToAuthState } from '../src/services/authService';
import { initCloudinaryService } from '../src/services/cloudinaryCloudFunctionService';
import { geocodeBusinessAddress } from '../src/services/geocodingService';

// Tipo para negócio
interface Business {
  id: number;
  firestoreId?: string;
  name: string;
  category?: string;
  categories: string[]; // Array de categorias (múltiplas)
  location: string;
  cep: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  number?: string;
  phone: string;
  whatsapp: string;
  description: string;
  image: any;
  lat: number | null;
  lon: number | null;
  origemGeo?: 'gps' | 'cep' | 'endereco' | null;
  instagram?: string;
  facebook?: string;
  pinterest?: string;
  owner?: string | null;
  ownerId?: string | null;
  entregaRapida?: boolean; // Tag para entrega rápida na região
  totalFavoritos?: number; // Total de vezes que foi favoritado
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
    cep?: string; // Código postal
    street?: string; // Rua
    number?: string; // Número
    neighborhood?: string; // Bairro
    city?: string; // Cidade
    state?: string; // Estado
    lat?: number; // Latitude persistida no perfil
    lon?: number; // Longitude persistida no perfil
    geohash?: string; // Geohash persistido no perfil
    PERMISSAO?: string; // Campo principal de permissão (maiúsculo)
    permissao?: string; // Compatibilidade
    papel?: string; // Papel do usuário (usuario, moderador, admin, super_admin)
}

interface RegistrationDraft {
  name: string;
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

// Tipo para contexto
interface AppContextType {
  navigateTo: (screen: string) => void; // Navegar para tela
  navigateBack: () => void; // Voltar para tela anterior
  currentScreen: string; // Tela atual
  setCurrentScreen: (screen: string) => void; // Define tela atual
  setSelectedBusiness: (business: Business | null) => void; // Define negócio selecionado
  selectedBusiness: Business | null; // Negócio selecionado
  favorites: number[]; // Lista de favoritos
  setFavorites: React.Dispatch<React.SetStateAction<number[]>>; // Define favoritos
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
  reportBusiness: { id: number; firestoreId?: string; name: string } | null; // Negócio para reportar
  setReportBusiness: (business: { id: number; firestoreId?: string; name: string } | null) => void; // Define negócio para reportar
  showUpdateProfileDialog: boolean; // Exibir dialog de atualização de perfil
  setShowUpdateProfileDialog: (show: boolean) => void; // Define estado do dialog
  registrationDraft: RegistrationDraft; // Rascunho do cadastro
  setRegistrationDraft: React.Dispatch<React.SetStateAction<RegistrationDraft>>; // Atualiza rascunho do cadastro
}

// Contexto
const AppContext = createContext<AppContextType | undefined>(undefined);

const emptyRegistrationDraft: RegistrationDraft = {
  name: '',
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  cpf: '',
  cep: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
};

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
  const [reportBusiness, setReportBusiness] = useState<{ id: number; firestoreId?: string; name: string } | null>(null); // Negócio para reportar
  const [showUpdateProfileDialog, setShowUpdateProfileDialog] = useState(false); // Dialog atualização perfil
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft>(emptyRegistrationDraft); // Rascunho cadastro
  const [isDarkMode, setIsDarkMode] = useState(false); // Modo escuro
  const colorScheme = useColorScheme(); // Esquema de cores do dispositivo

  // Gera ID numérico estável a partir do doc.id do Firestore para manter favoritos consistentes.
  const stableNumericIdFromString = (value: string): number => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
  };

  const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  // Inicializa Cloud Functions para deleção segura de imagens
  useEffect(() => {
    try {
      initCloudinaryService(app, false); // Sempre usar produção
      console.log('✓ Cloud Functions inicializado para deleção de imagens');
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar Cloud Functions:', error);
    }
  }, []);

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
        setLocationSettings(null);
      }
    });

    return () => unsubscribe?.(); // Cleanup
  }, []);

  useEffect(() => {
    let active = true;

    const resolveDefaultLocation = async () => {
      if (locationSettings?.coords) {
        return;
      }

      if (!userProfile) {
        return;
      }

      const hasAddress = Boolean(
        userProfile.cep ||
        userProfile.street ||
        userProfile.number ||
        userProfile.neighborhood ||
        userProfile.city ||
        userProfile.state
      );

      const hasPersistedCoords =
        typeof userProfile.lat === 'number' &&
        typeof userProfile.lon === 'number';

      if (hasPersistedCoords) {
        if (!active) return;

        setLocationSettings({
          mode: 'address',
          cep: userProfile.cep || '',
          address: [userProfile.street, userProfile.number, userProfile.neighborhood, userProfile.city, userProfile.state]
            .filter(Boolean)
            .join(', '),
          coords: { lat: userProfile.lat as number, lon: userProfile.lon as number },
          geoSource: 'endereco',
          geohash: userProfile.geohash || null,
        });
        return;
      }

      if (!hasAddress) {
        return;
      }

      try {
        const geo = await geocodeBusinessAddress({
          cep: userProfile.cep,
          street: userProfile.street,
          number: userProfile.number,
          neighborhood: userProfile.neighborhood,
          city: userProfile.city,
          state: userProfile.state,
          country: 'Brasil',
        });

        if (!active || !geo) {
          return;
        }

        setLocationSettings({
          mode: 'address',
          cep: userProfile.cep || '',
          address: [userProfile.street, userProfile.number, userProfile.neighborhood, userProfile.city, userProfile.state]
            .filter(Boolean)
            .join(', '),
          coords: { lat: geo.lat, lon: geo.lon },
          geoSource: geo.source,
        });
      } catch (error) {
        console.warn('Falha ao resolver localização padrão do usuário:', error);
      }
    };

    void resolveDefaultLocation();

    return () => {
      active = false;
    };
  }, [userProfile, locationSettings]);

  // Carrega anúncios do Firestore ao iniciar
  useEffect(() => {
    const carregarAnuncios = async () => {
      const loadMockBusinesses = () => {
        const fallback = (mockBusinesses || []).map((mock: any, index: number) => ({
          id: typeof mock.id === 'number' ? mock.id : index + 1,
          firestoreId: undefined,
          name: mock.name || 'Negócio',
          category: Array.isArray(mock.categories) ? mock.categories[0] : mock.category,
          categories: Array.isArray(mock.categories) ? mock.categories : [mock.category].filter(Boolean),
          location: mock.location || '',
          cep: mock.cep || '',
          street: mock.street,
          neighborhood: mock.neighborhood,
          city: mock.city,
          state: mock.state,
          number: mock.number,
          phone: mock.phone || '',
          whatsapp: mock.whatsapp || '',
          description: mock.description || '',
          image: mock.image || null,
          lat: toFiniteNumber(mock.lat),
          lon: toFiniteNumber(mock.lon),
          origemGeo: mock.origemGeo ?? null,
          instagram: mock.instagram,
          facebook: mock.facebook,
          pinterest: mock.pinterest,
          owner: null,
          ownerId: null,
          entregaRapida: Boolean(mock.entregaRapida),
          contactVisibility: mock.contactVisibility,
        }));

        console.warn(`⚠️ Usando fallback local com ${fallback.length} anúncio(s) de mock.`);
        setBusinesses(fallback);
      };

      try {
        const anuncios = await getAllActiveAnuncios();
        
        if (anuncios.length > 0) {
          // Converter anúncios para formato de Business
          const businesses = anuncios.map(anuncio => {
            const enderecoPartes = [anuncio.street, anuncio.number, anuncio.neighborhood, anuncio.city, anuncio.state]
              .filter(Boolean)
              .join(', ');

            const stableId = anuncio.id ? stableNumericIdFromString(anuncio.id) : stableNumericIdFromString(`${anuncio.name}-${anuncio.userId}`);

            return ({
            id: stableId,
            firestoreId: anuncio.id,
            name: anuncio.name,
            category: anuncio.category,
            categories: [anuncio.category],
            location: anuncio.location || enderecoPartes,
            cep: anuncio.cep,
            street: anuncio.street,
            neighborhood: anuncio.neighborhood,
            city: anuncio.city,
            state: anuncio.state,
            number: anuncio.number,
            phone: anuncio.phone,
            whatsapp: anuncio.whatsapp,
            description: anuncio.description,
            image: anuncio.fotos?.[0] || null,
            lat: toFiniteNumber(anuncio.lat),
            lon: toFiniteNumber(anuncio.lon),
            origemGeo: anuncio.origemGeo ?? null,
            instagram: anuncio.instagram,
            facebook: anuncio.facebook,
            pinterest: anuncio.pinterest,
            owner: anuncio.userEmail || null,
            ownerId: anuncio.userId || null,
            entregaRapida: anuncio.entregaRapida,
            contactVisibility: anuncio.contactVisibility,
          });
          });
          setBusinesses(businesses);
        } else {
          loadMockBusinesses();
        }
      } catch (error) {
        console.error('❌ Erro ao buscar anúncios:', error);
        loadMockBusinesses();
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
    const isFavorite = (favorites || []).includes(id);
    
    // Atualizar estado local PRIMEIRO
    const newFavorites = isFavorite
      ? (favorites || []).filter((fav) => fav !== id)
      : [...(favorites || []), id];

    setFavorites(newFavorites);

    // Sincronizar com Firebase se logado
    if (isLoggedIn) {
      const syncFavorite = async () => {
        try {
          const auth = getAuth(app);
          const currentUser = auth.currentUser;

          if (currentUser?.uid) {
            if (isFavorite) {
              await removeFavorite(currentUser.uid, id);
            } else {
              await addFavorite(currentUser.uid, id);
            }
          } else {
            console.warn('⚠️ currentUser.uid não encontrado!');
          }
        } catch (error) {
          console.error('❌ Erro ao sincronizar favorito:', error);
        }
      };
      
      // Executar imediatamente sem delay
      syncFavorite();
    } else {
      console.warn('⚠️ Usuário não está logado!');
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
        setCurrentScreen,
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
        registrationDraft,
        setRegistrationDraft,
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
