import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    endAt,
    getDocs,
    getFirestore,
    limit,
    orderBy,
    query,
    startAt,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { geohashForLocation, geohashQueryBounds } from 'geofire-common';
import app from '../../firebaseConfig';

const firestore = getFirestore(app);
let geoCompositeIndexWarningShown = false;

const isMissingIndexError = (error: any) => {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  return code.includes('failed-precondition') || message.includes('requires an index');
};

const normalizeCep = (value?: string) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length !== 8) return value;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

function mapAnuncioFromFirestore(docData: any): Omit<Anuncio, 'id'> {
  return {
    businessId: docData?.idNegocio ?? docData?.businessId,
    userId: docData?.usuarioId ?? docData?.userId,
    userEmail: docData?.emailUsuario ?? docData?.userEmail,
    name: docData?.nome ?? docData?.name,
    category: docData?.categoria ?? docData?.category,
    description: docData?.descricao ?? docData?.description,
    location: docData?.localizacao ?? docData?.location,
    cep: docData?.cep,
    street: docData?.rua ?? docData?.street,
    neighborhood: docData?.bairro ?? docData?.neighborhood,
    city: docData?.cidade ?? docData?.city,
    state: docData?.estado ?? docData?.state,
    number: docData?.numero ?? docData?.number,
    lat: toFiniteNumber(docData?.lat ?? docData?.latitude),
    lon: toFiniteNumber(docData?.lon ?? docData?.longitude),
    geohash: docData?.geohash ?? null,
    origemGeo: docData?.origemGeo ?? null,
    phone: docData?.telefone ?? docData?.phone,
    whatsapp: docData?.whatsapp,
    email: docData?.email,
    site: docData?.site,
    instagram: docData?.instagram,
    facebook: docData?.facebook,
    pinterest: docData?.pinterest,
    fotos: docData?.fotos ?? [],
    entregaRapida: docData?.entregaRapida ?? false,
    isImperdivel: docData?.imperdivel ?? docData?.isImperdivel ?? false,
    contactVisibility: docData?.visibilidadeContato ?? docData?.contactVisibility ?? {
      phone: true,
      whatsapp: true,
      email: true,
      site: true,
      instagram: true,
      facebook: true,
      pinterest: true,
    },
    status: docData?.status,
    motivoReprovacao: docData?.motivoReprovacao ?? null,
    reportCount: docData?.totalDenuncias ?? docData?.reportCount ?? 0,
    anuncianteLevel: docData?.nivelAnunciante ?? docData?.anuncianteLevel ?? 1,
    createdAt: docData?.criadoEm ?? docData?.createdAt,
    updatedAt: docData?.atualizadoEm ?? docData?.updatedAt,
    expiresAt: docData?.expiraEm ?? docData?.expiresAt,
  };
}

function mapAnuncioToFirestore(anuncio: Partial<Anuncio>): Record<string, any> {
  const mapped: Record<string, any> = {};

  if (anuncio.businessId !== undefined) mapped.idNegocio = anuncio.businessId;
  if (anuncio.userId !== undefined) mapped.usuarioId = anuncio.userId;
  if (anuncio.userEmail !== undefined) mapped.emailUsuario = anuncio.userEmail;

  if (anuncio.name !== undefined) mapped.nome = anuncio.name;
  if (anuncio.category !== undefined) mapped.categoria = anuncio.category;
  if (anuncio.description !== undefined) mapped.descricao = anuncio.description;

  if (anuncio.location !== undefined) mapped.localizacao = anuncio.location;
  if (anuncio.cep !== undefined) mapped.cep = normalizeCep(anuncio.cep);
  if (anuncio.street !== undefined) mapped.rua = anuncio.street;
  if (anuncio.neighborhood !== undefined) mapped.bairro = anuncio.neighborhood;
  if (anuncio.city !== undefined) mapped.cidade = anuncio.city;
  if (anuncio.state !== undefined) mapped.estado = anuncio.state;
  if (anuncio.number !== undefined) mapped.numero = anuncio.number;
  if (anuncio.lat !== undefined) mapped.lat = anuncio.lat;
  if (anuncio.lon !== undefined) mapped.lon = anuncio.lon;
  if (anuncio.geohash !== undefined) mapped.geohash = anuncio.geohash;
  if (anuncio.origemGeo !== undefined) mapped.origemGeo = anuncio.origemGeo;

  if (anuncio.phone !== undefined) mapped.telefone = anuncio.phone;
  if (anuncio.whatsapp !== undefined) mapped.whatsapp = anuncio.whatsapp;
  if (anuncio.email !== undefined) mapped.email = anuncio.email;
  if (anuncio.site !== undefined) mapped.site = anuncio.site;
  if (anuncio.instagram !== undefined) mapped.instagram = anuncio.instagram;
  if (anuncio.facebook !== undefined) mapped.facebook = anuncio.facebook;
  if (anuncio.pinterest !== undefined) mapped.pinterest = anuncio.pinterest;

  if (anuncio.fotos !== undefined) mapped.fotos = anuncio.fotos;

  if (anuncio.entregaRapida !== undefined) mapped.entregaRapida = anuncio.entregaRapida;
  if (anuncio.isImperdivel !== undefined) mapped.imperdivel = anuncio.isImperdivel;

  if (anuncio.contactVisibility !== undefined) mapped.visibilidadeContato = anuncio.contactVisibility;

  if (anuncio.status !== undefined) mapped.status = anuncio.status;
  if (anuncio.motivoReprovacao !== undefined) mapped.motivoReprovacao = anuncio.motivoReprovacao;
  if (anuncio.reportCount !== undefined) mapped.totalDenuncias = anuncio.reportCount;
  if (anuncio.anuncianteLevel !== undefined) mapped.nivelAnunciante = anuncio.anuncianteLevel;

  if (anuncio.createdAt !== undefined) mapped.criadoEm = anuncio.createdAt;
  if (anuncio.updatedAt !== undefined) mapped.atualizadoEm = anuncio.updatedAt;
  if (anuncio.expiresAt !== undefined) mapped.expiraEm = anuncio.expiresAt;

  return mapped;
}

const isValidCoordinate = (value: unknown) => typeof value === 'number' && Number.isFinite(value);

const withGeohashIfPossible = (payload: Partial<Anuncio>): Partial<Anuncio> => {
  const lat = payload.lat;
  const lon = payload.lon;

  if (isValidCoordinate(lat) && isValidCoordinate(lon)) {
    return {
      ...payload,
      geohash: geohashForLocation([lat, lon]),
    };
  }

  if (lat === null || lon === null) {
    return {
      ...payload,
      geohash: null,
    };
  }

  return payload;
};

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
  neighborhood: string;
  city: string;
  state: string;
  number: string;
  lat: number | null;
  lon: number | null;
  geohash?: string | null;
  origemGeo?: 'gps' | 'cep' | 'endereco' | null;
  
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
  status: 'pendente' | 'aprovado' | 'reprovado' | 'arquivado';
  motivoReprovacao?: string | null;
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
    const anuncioComGeohash = withGeohashIfPossible(anuncio);
    const docRef = await addDoc(collection(firestore, 'anuncios'), {
      ...mapAnuncioToFirestore(anuncioComGeohash),
      criadoEm: now,
      atualizadoEm: now,
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
    const updatesComGeohash = withGeohashIfPossible(updates);
    await updateDoc(anuncioRef, {
      ...mapAnuncioToFirestore(updatesComGeohash),
      atualizadoEm: Timestamp.now(),
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
 * Aprova um anúncio (muda status para 'aprovado')
 * @param anuncioId - ID do anúncio
 * @param moderadorId - ID do moderador
 */
export const aprovarAnuncio = async (anuncioId: string, moderadorId: string): Promise<void> => {
  try {
    const anuncioRef = doc(firestore, 'anuncios', anuncioId);
    await updateDoc(anuncioRef, {
      status: 'aprovado',
      moderadoPor: moderadorId,
      moderadoEm: Timestamp.now(),
      motivoReprovacao: null, // Limpar motivo se houver
    });
    
    console.log('Anúncio aprovado:', anuncioId);
  } catch (error) {
    console.error('Erro ao aprovar anúncio:', error);
    throw error;
  }
};

/**
 * Reprova um anúncio (muda status para 'reprovado')
 * @param anuncioId - ID do anúncio
 * @param moderadorId - ID do moderador
 * @param motivo - Motivo da reprovação
 */
export const reprovarAnuncio = async (anuncioId: string, moderadorId: string, motivo: string): Promise<void> => {
  try {
    const anuncioRef = doc(firestore, 'anuncios', anuncioId);
    await updateDoc(anuncioRef, {
      status: 'reprovado',
      moderadoPor: moderadorId,
      moderadoEm: Timestamp.now(),
      motivoReprovacao: motivo,
    });
    
    console.log('Anúncio reprovado:', anuncioId);
  } catch (error) {
    console.error('Erro ao reprovar anúncio:', error);
    throw error;
  }
};

/**
 * Arquiva um anúncio (muda status para 'arquivado')
 * @param anuncioId - ID do anúncio
 * @param moderadorId - ID do moderador
 * @param motivo - Motivo do arquivamento
 */
export const arquivarAnuncio = async (anuncioId: string, moderadorId: string, motivo: string): Promise<void> => {
  try {
    const anuncioRef = doc(firestore, 'anuncios', anuncioId);
    await updateDoc(anuncioRef, {
      status: 'arquivado',
      moderadoPor: moderadorId,
      moderadoEm: Timestamp.now(),
      motivoReprovacao: motivo,
    });
    
    console.log('Anúncio arquivado:', anuncioId);
  } catch (error) {
    console.error('Erro ao arquivar anúncio:', error);
    throw error;
  }
};

/**
 * Busca anúncios pendentes para moderação
 */
export const getAnunciosPendentes = async (): Promise<Anuncio[]> => {
  try {
    const baseQuery = query(
      collection(firestore, 'anuncios'),
      where('status', '==', 'pendente'),
      limit(50)
    );

    const querySnapshot = await getDocs(baseQuery);

    const anuncios = querySnapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...mapAnuncioFromFirestore(docSnap.data()),
      }))
      .sort((a, b) => {
        const aMillis = typeof (a.createdAt as any)?.toMillis === 'function'
          ? (a.createdAt as any).toMillis()
          : 0;
        const bMillis = typeof (b.createdAt as any)?.toMillis === 'function'
          ? (b.createdAt as any).toMillis()
          : 0;
        return bMillis - aMillis;
      });

    return anuncios;
  } catch (error) {
    if (isMissingIndexError(error)) {
      console.warn('Indice composto ausente para pendentes; usando fallback sem ordenacao no servidor.');
    }
    console.error('Erro ao buscar anúncios pendentes:', error);
    return [];
  }
};

/**
 * Conta anúncios pendentes
 */
export const getContagemAnunciosPendentes = async (): Promise<number> => {
  try {
    const anuncios = await getAnunciosPendentes();
    return anuncios.length;
  } catch (error) {
    console.error('Erro ao contar anúncios pendentes:', error);
    return 0;
  }
};

export interface ResumoModeracaoAnuncios {
  total: number;
  pendente: number;
  aprovado: number;
  reprovado: number;
  arquivado: number;
}

export const getResumoModeracaoAnuncios = async (): Promise<ResumoModeracaoAnuncios> => {
  try {
    const snapshot = await getDocs(collection(firestore, 'anuncios'));

    const resumo: ResumoModeracaoAnuncios = {
      total: 0,
      pendente: 0,
      aprovado: 0,
      reprovado: 0,
      arquivado: 0,
    };

    snapshot.forEach((docSnap) => {
      resumo.total += 1;
      const status = String(docSnap.data()?.status || 'pendente');

      if (status === 'aprovado') resumo.aprovado += 1;
      else if (status === 'reprovado') resumo.reprovado += 1;
      else if (status === 'arquivado') resumo.arquivado += 1;
      else resumo.pendente += 1;
    });

    return resumo;
  } catch (error) {
    console.error('Erro ao resumir moderação de anúncios:', error);
    return { total: 0, pendente: 0, aprovado: 0, reprovado: 0, arquivado: 0 };
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
      where('usuarioId', '==', userId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const anuncios: Anuncio[] = [];
    
    querySnapshot.forEach((doc) => {
      anuncios.push({
        id: doc.id,
        ...mapAnuncioFromFirestore(doc.data()),
      });
    });
    
    return anuncios;
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    throw error;
  }
};

/**
 * Busca anúncios do usuário com todos os status de moderação.
 */
export const getAnunciosDoUsuarioComModeracao = async (userId: string, userEmail?: string): Promise<Anuncio[]> => {
  try {
    const snapshots = await Promise.all([
      getDocs(query(collection(firestore, 'anuncios'), where('usuarioId', '==', userId))),
      getDocs(query(collection(firestore, 'anuncios'), where('userId', '==', userId))),
      userEmail
        ? getDocs(query(collection(firestore, 'anuncios'), where('emailUsuario', '==', userEmail)))
        : Promise.resolve(null as any),
      userEmail
        ? getDocs(query(collection(firestore, 'anuncios'), where('userEmail', '==', userEmail)))
        : Promise.resolve(null as any),
    ]);

    const unique = new Map<string, Anuncio>();

    snapshots.forEach((snap: any) => {
      if (!snap) return;
      snap.forEach((docSnap: any) => {
        unique.set(docSnap.id, {
          id: docSnap.id,
          ...mapAnuncioFromFirestore(docSnap.data()),
        });
      });
    });

    return Array.from(unique.values()).sort((a, b) => {
      const aMs = (a.createdAt as any)?.toMillis?.() ?? 0;
      const bMs = (b.createdAt as any)?.toMillis?.() ?? 0;
      return bMs - aMs;
    });
  } catch (error) {
    console.error('Erro ao buscar anúncios do usuário com moderação:', error);
    return [];
  }
};

/**
 * Busca todos os anúncios ativos (público)
 * @returns Array de anúncios
 */
export const getAllActiveAnuncios = async (): Promise<Anuncio[]> => {
  try {
    // Aceita tanto 'aprovado' (PT-BR) quanto 'active' (código legado/EN)
    const activeQuery = query(
      collection(firestore, 'anuncios'),
      where('status', 'in', ['aprovado', 'active'])
    );

    const querySnapshot = await getDocs(activeQuery);
    let anuncios: Anuncio[] = [];

    querySnapshot.forEach((doc) => {
      anuncios.push({
        id: doc.id,
        ...mapAnuncioFromFirestore(doc.data()),
      });
    });

    // Compatibilidade com documentos antigos sem campo status.
    // Ao usar fallback, incluir apenas anúncios aprovados ('aprovado' ou 'active')
    // para evitar expor anúncios pendentes publicamente.
    if (anuncios.length === 0) {
      const allDocs = await getDocs(collection(firestore, 'anuncios'));
      allDocs.forEach((doc) => {
        const mapped = mapAnuncioFromFirestore(doc.data());
        const status = String(mapped.status || '').toLowerCase();
        if (status === 'aprovado' || status === 'active') {
          anuncios.push({
            id: doc.id,
            ...mapped,
          });
        }
      });
    }

    return anuncios;
  } catch (error) {
    console.error('Erro ao buscar anúncios públicos:', error);
    throw error;
  }
};

interface NearbySearchInput {
  center: { lat: number; lon: number };
  radiusKm: number;
}

/**
 * Busca anúncios ativos próximos usando geohash no Firestore e refina por distância real.
 */
export const getNearbyActiveAnuncios = async ({ center, radiusKm }: NearbySearchInput): Promise<Anuncio[]> => {
  try {
    const effectiveRadiusKm = Math.max(0.1, radiusKm || 1);
    const bounds = geohashQueryBounds([center.lat, center.lon], effectiveRadiusKm * 1000);

    const runGeohashQuery = (includeStatusFilter: boolean) =>
      Promise.all(
        bounds.map(([start, end]) => {
          const constraints = [orderBy('geohash'), startAt(start), endAt(end)] as any[];
          if (includeStatusFilter) {
            constraints.unshift(where('status', 'in', ['aprovado', 'active']));
          }

          const q = query(collection(firestore, 'anuncios'), ...constraints);
          return getDocs(q);
        })
      );

    let snapshots;
    try {
      snapshots = await runGeohashQuery(true);
    } catch (error) {
      if (!isMissingIndexError(error)) {
        throw error;
      }

      if (!geoCompositeIndexWarningShown) {
        geoCompositeIndexWarningShown = true;
        console.warn('Indice composto status+geohash ausente. Usando fallback geohash com filtro local de status.');
      }

      snapshots = await runGeohashQuery(false);
    }

    const uniqueById = new Map<string, Anuncio>();

    snapshots.forEach((snapshot) => {
      snapshot.forEach((docSnap) => {
        if (uniqueById.has(docSnap.id)) return;
        const mapped = mapAnuncioFromFirestore(docSnap.data());
        uniqueById.set(docSnap.id, {
          id: docSnap.id,
          ...mapped,
        });
      });
    });

    // Refino circular pelo raio real para remover "quinas" do bounding box.
    const inRadius = Array.from(uniqueById.values()).filter((anuncio) => {
      if (anuncio.status !== 'active' && anuncio.status !== 'aprovado') return false;
      if (typeof anuncio.lat !== 'number' || typeof anuncio.lon !== 'number') return false;
      const distanceM = haversineM(center.lat, center.lon, anuncio.lat, anuncio.lon);
      return distanceM <= effectiveRadiusKm * 1000;
    });

    return inRadius;
  } catch (error) {
    console.error('Erro ao buscar anúncios por geolocalização:', error);
    throw error;
  }
};

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Busca anúncios por categoria
 * @param category - Categoria desejada
 * @returns Array de anúncios
 */
export const getAnunciosByCategory = async (category: string): Promise<Anuncio[]> => {
  try {
    const q = query(
      collection(firestore, 'anuncios'),
      where('categoria', '==', category),
      where('status', 'in', ['aprovado', 'active'])
    );
    
    const querySnapshot = await getDocs(q);
    const anuncios: Anuncio[] = [];
    
    querySnapshot.forEach((doc) => {
      anuncios.push({
        id: doc.id,
        ...mapAnuncioFromFirestore(doc.data()),
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
      where('status', 'in', ['aprovado', 'active'])
    );
    
    const querySnapshot = await getDocs(q);
    const anuncios: Anuncio[] = [];
    const keywordLower = keyword.toLowerCase();
    
    querySnapshot.forEach((doc) => {
      const data = mapAnuncioFromFirestore(doc.data());
      if (
        (data.name && data.name.toLowerCase().includes(keywordLower)) ||
        (data.description && data.description.toLowerCase().includes(keywordLower))
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
