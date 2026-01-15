import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import app from '../../firebaseConfig';

const firestore = getFirestore(app);

/**
 * Interface para estrutura de um anúncio
 */
export interface Anuncio {
  id?: string;
  businessId?: string; // ID do documento no Firestore
  userId: string; // UID do usuário
  userEmail: string;
  
  // Dados básicos
  name: string;
  category: string;
  description: string;
  
  // Localização
  location: string;
  cep: string;
  street: string;
  number: string;
  
  // Contatos
  phone: string;
  whatsapp: string;
  email: string;
  site?: string;
  instagram?: string;
  facebook?: string;
  pinterest?: string;
  
  // Mídia
  fotos: string[]; // URLs do Cloudinary
  
  // Recursos Premium
  entregaRapida: boolean;
  isImperdivel: boolean;
  
  // Visibilidade de contatos
  contactVisibility: {
    phone: boolean;
    whatsapp: boolean;
    email: boolean;
    site: boolean;
    instagram: boolean;
    facebook: boolean;
    pinterest: boolean;
  };
  
  // Metadados
  status: 'active' | 'inactive' | 'reported' | 'deleted';
  reportCount: number;
  anuncianteLevel: 1 | 2 | 3 | 4;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp; // Opcional: para controle de expiração
}

/**
 * Cria um novo anúncio no Firestore
 * @param anuncio - Dados do anúncio
 * @returns ID do documento criado
 */
export const createAnuncio = async (anuncio: Omit<Anuncio, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(firestore, 'anuncios'), {
      ...anuncio,
      createdAt: now,
      updatedAt: now,
    });
    
    console.log('Anúncio criado com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar anúncio:', error);
    throw error;
  }
};

/**
 * Atualiza um anúncio existente
 * @param anuncioId - ID do anúncio
 * @param updates - Campos a atualizar
 */
export const updateAnuncio = async (
  anuncioId: string,
  updates: Partial<Anuncio>
): Promise<void> => {
  try {
    const anuncioRef = doc(firestore, 'anuncios', anuncioId);
    await updateDoc(anuncioRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    
    console.log('Anúncio atualizado:', anuncioId);
  } catch (error) {
    console.error('Erro ao atualizar anúncio:', error);
    throw error;
  }
};

/**
 * Deleta um anúncio
 * @param anuncioId - ID do anúncio
 */
export const deleteAnuncio = async (anuncioId: string): Promise<void> => {
  try {
    const anuncioRef = doc(firestore, 'anuncios', anuncioId);
    await deleteDoc(anuncioRef);
    
    console.log('Anúncio deletado:', anuncioId);
  } catch (error) {
    console.error('Erro ao deletar anúncio:', error);
    throw error;
  }
};

/**
 * Busca todos os anúncios de um usuário
 * @param userId - UID do usuário
 * @returns Array de anúncios
 */
export const getAnunciosByUser = async (userId: string): Promise<Anuncio[]> => {
  try {
    const q = query(
      collection(firestore, 'anuncios'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const anuncios: Anuncio[] = [];
    
    querySnapshot.forEach((doc) => {
      anuncios.push({
        id: doc.id,
        ...doc.data() as Omit<Anuncio, 'id'>,
      });
    });
    
    return anuncios;
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    throw error;
  }
};

/**
 * Busca todos os anúncios ativos (público)
 * @returns Array de anúncios
 */
export const getAllActiveAnuncios = async (): Promise<Anuncio[]> => {
  try {
    const q = query(
      collection(firestore, 'anuncios'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const anuncios: Anuncio[] = [];
    
    querySnapshot.forEach((doc) => {
      anuncios.push({
        id: doc.id,
        ...doc.data() as Omit<Anuncio, 'id'>,
      });
    });
    
    return anuncios;
  } catch (error) {
    console.error('Erro ao buscar anúncios públicos:', error);
    throw error;
  }
};

/**
 * Busca anúncios por categoria
 * @param category - Categoria desejada
 * @returns Array de anúncios
 */
export const getAnunciosByCategory = async (category: string): Promise<Anuncio[]> => {
  try {
    const q = query(
      collection(firestore, 'anuncios'),
      where('category', '==', category),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const anuncios: Anuncio[] = [];
    
    querySnapshot.forEach((doc) => {
      anuncios.push({
        id: doc.id,
        ...doc.data() as Omit<Anuncio, 'id'>,
      });
    });
    
    return anuncios;
  } catch (error) {
    console.error('Erro ao buscar anúncios por categoria:', error);
    throw error;
  }
};

/**
 * Busca anúncios por palavra-chave (nome ou descrição)
 * @param keyword - Palavra-chave de busca
 * @returns Array de anúncios
 */
export const searchAnuncios = async (keyword: string): Promise<Anuncio[]> => {
  try {
    // Firestore não tem busca full-text, então busca por nome
    // Para busca mais robusta, usar Algolia ou similar no futuro
    const q = query(
      collection(firestore, 'anuncios'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const anuncios: Anuncio[] = [];
    const keywordLower = keyword.toLowerCase();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<Anuncio, 'id'>;
      if (
        data.name.toLowerCase().includes(keywordLower) ||
        data.description.toLowerCase().includes(keywordLower)
      ) {
        anuncios.push({
          id: doc.id,
          ...data,
        });
      }
    });
    
    return anuncios;
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    throw error;
  }
};
