import { addDoc, collection, doc, getDocs, getFirestore, limit, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import app from '../../firebaseConfig';

const db = getFirestore(app);

export interface Denuncia {
  id: string;
  anuncioId: string;
  denuncianteId: string;
  motivo: string;
  descricao: string;
  criadoEm: Timestamp;
  status: 'aberta' | 'em_analise' | 'resolvida';
  carimbo?: string;
  moderadoPor?: string;
  moderadoEm?: Timestamp;
  decisao?: 'aceita' | 'nao_aceita';
  justificativa?: string;
}

/**
 * Busca denúncias do usuário denunciante para exibir retorno da moderação
 */
export async function getDenunciasDoDenunciante(denuncianteId: string): Promise<Denuncia[]> {
  try {
    const denunciasRef = collection(db, 'denuncias');
    const q = query(denunciasRef, where('denuncianteId', '==', denuncianteId), limit(100));
    const querySnapshot = await getDocs(q);
    const denuncias: Denuncia[] = [];

    querySnapshot.forEach((docSnap) => {
      denuncias.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Denuncia, 'id'>),
      });
    });

    return denuncias.sort((a, b) => {
      const aMs = a.criadoEm?.toMillis?.() ?? 0;
      const bMs = b.criadoEm?.toMillis?.() ?? 0;
      return bMs - aMs;
    });
  } catch (error) {
    console.error('Erro ao buscar denúncias do denunciante:', error);
    return [];
  }
}

/**
 * Cria uma nova denúncia no Firestore
 */
export async function criarDenuncia(denunciaData: {
  anuncioId: string;
  denuncianteId: string;
  motivo: string;
  descricao: string;
}): Promise<string> {
  try {
    const denunciasRef = collection(db, 'denuncias');

    const novaDenuncia = {
      anuncioId: denunciaData.anuncioId,
      denuncianteId: denunciaData.denuncianteId,
      motivo: denunciaData.motivo,
      descricao: denunciaData.descricao,
      criadoEm: Timestamp.now(),
      status: 'aberta' as const,
    };

    const docRef = await addDoc(denunciasRef, novaDenuncia);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar denúncia:', error);
    throw new Error('Falha ao enviar denúncia. Tente novamente.');
  }
}

/**
 * Busca todas as denúncias pendentes (status: 'aberta' ou 'em_analise')
 */
export async function getDenunciasPendentes(): Promise<Denuncia[]> {
  try {
    const denunciasRef = collection(db, 'denuncias');
    const q = query(
      denunciasRef,
      where('status', 'in', ['aberta', 'em_analise']),
      orderBy('criadoEm', 'desc'),
      limit(50) // Limite para performance
    );

    const querySnapshot = await getDocs(q);
    const denuncias: Denuncia[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      denuncias.push({
        id: doc.id,
        ...data,
      } as Denuncia);
    });

    return denuncias;
  } catch (error) {
    console.error('Erro ao buscar denúncias pendentes:', error);
    return [];
  }
}

/**
 * Conta o número de denúncias pendentes
 */
export async function getContagemDenunciasPendentes(): Promise<number> {
  try {
    const denuncias = await getDenunciasPendentes();
    return denuncias.length;
  } catch (error) {
    console.error('Erro ao contar denúncias pendentes:', error);
    return 0;
  }
}

export interface ResumoModeracaoDenuncias {
  total: number;
  abertas: number;
  emAnalise: number;
  resolvidas: number;
  aceitas: number;
  naoProcedentes: number;
}

export async function getResumoModeracaoDenuncias(): Promise<ResumoModeracaoDenuncias> {
  try {
    const denunciasRef = collection(db, 'denuncias');
    const snapshot = await getDocs(denunciasRef);

    const resumo: ResumoModeracaoDenuncias = {
      total: 0,
      abertas: 0,
      emAnalise: 0,
      resolvidas: 0,
      aceitas: 0,
      naoProcedentes: 0,
    };

    snapshot.forEach((docSnap) => {
      resumo.total += 1;
      const data = docSnap.data();
      const status = String(data?.status || 'aberta');
      const decisao = String(data?.decisao || '');

      if (status === 'em_analise') resumo.emAnalise += 1;
      else if (status === 'resolvida') resumo.resolvidas += 1;
      else resumo.abertas += 1;

      if (decisao === 'aceita') resumo.aceitas += 1;
      if (decisao === 'nao_aceita') resumo.naoProcedentes += 1;
    });

    return resumo;
  } catch (error) {
    console.error('Erro ao resumir moderação de denúncias:', error);
    return { total: 0, abertas: 0, emAnalise: 0, resolvidas: 0, aceitas: 0, naoProcedentes: 0 };
  }
}

/**
 * Resolve uma denúncia
 * @param denunciaId - ID da denúncia
 * @param moderadorId - ID do moderador que resolveu
 * @param decisao - 'aceita' ou 'nao_aceita'
 * @param justificativa - Justificativa da decisão
 */
export async function resolverDenuncia(
  denunciaId: string,
  moderadorId: string,
  decisao: 'aceita' | 'nao_aceita',
  justificativa: string
): Promise<void> {
  try {
    const denunciaRef = doc(db, 'denuncias', denunciaId);
    await updateDoc(denunciaRef, {
      status: 'resolvida',
      moderadoPor: moderadorId,
      moderadoEm: Timestamp.now(),
      decisao,
      justificativa,
    });

    console.log('Denúncia resolvida:', denunciaId);
  } catch (error) {
    console.error('Erro ao resolver denúncia:', error);
    throw error;
  }
}