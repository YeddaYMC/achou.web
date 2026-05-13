import {
    AuthError,
    createUserWithEmailAndPassword,
    deleteUser,
    EmailAuthProvider,
    getAuth,
    onAuthStateChanged,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    User
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';
import app from '../../firebaseConfig.js';
import { geocodeBusinessAddress } from './geocodingService';

const auth = getAuth(app);
const db = getFirestore(app);

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

function mapUserFromFirestore(data: any): UserProfile {
  const permissao = data?.PERMISSAO ?? data?.permissao ?? data?.papel;

  return {
    name: data?.nome ?? data?.name ?? '',
    nickname: data?.apelido ?? data?.nickname,
    email: data?.email ?? '',
    phone: data?.telefone ?? data?.phone ?? '',
    cpf: data?.cpf ?? '',
    anuncianteLevel: (data?.nivelAnunciante ?? data?.anuncianteLevel ?? 1) as 1 | 2 | 3 | 4,
    createdAt: data?.criadoEm ?? data?.createdAt ?? new Date().toISOString(),
    cep: data?.cep ?? '',
    street: data?.rua ?? data?.street ?? '',
    number: data?.numero ?? data?.number ?? '',
    neighborhood: data?.bairro ?? data?.neighborhood ?? '',
    city: data?.cidade ?? data?.city ?? '',
    state: data?.estado ?? data?.state ?? '',
    lat: toFiniteNumber(data?.lat ?? data?.latitude),
    lon: toFiniteNumber(data?.lon ?? data?.longitude),
    geohash: data?.geohash ?? data?.geoHash,
    PERMISSAO: permissao,
    permissao,
    papel: permissao,
  };
}

function mapUserToFirestore(data: Partial<UserProfile>): Record<string, any> {
  const mapped: Record<string, any> = {};

  if (data.name !== undefined) mapped.nome = data.name;
  if (data.nickname !== undefined) mapped.apelido = data.nickname;
  if (data.email !== undefined) mapped.email = data.email;
  if (data.phone !== undefined) mapped.telefone = data.phone;
  if (data.cpf !== undefined) mapped.cpf = data.cpf;
  if (data.anuncianteLevel !== undefined) mapped.nivelAnunciante = data.anuncianteLevel;
  if (data.createdAt !== undefined) mapped.criadoEm = data.createdAt;
  if (data.cep !== undefined) mapped.cep = data.cep;
  if (data.street !== undefined) mapped.rua = data.street;
  if (data.number !== undefined) mapped.numero = data.number;
  if (data.neighborhood !== undefined) mapped.bairro = data.neighborhood;
  if (data.city !== undefined) mapped.cidade = data.city;
  if (data.state !== undefined) mapped.estado = data.state;
  if (data.lat !== undefined) mapped.lat = data.lat;
  if (data.lon !== undefined) mapped.lon = data.lon;
  if (data.geohash !== undefined) mapped.geohash = data.geohash;

  return mapped;
}

// Interface para perfil de usuário
export interface UserProfile {
  name: string;
  nickname?: string;
  email: string;
  phone: string;
  cpf: string;
  anuncianteLevel: 1 | 2 | 3 | 4;
  createdAt: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  lat?: number;
  lon?: number;
  geohash?: string;
  PERMISSAO?: string;
  permissao?: string;
  papel?: string;
}

// Registrar novo usuário com email/senha
export async function registerWithEmail(
  email: string,
  password: string,
  userData: Omit<UserProfile, 'createdAt'>
) {
  const normalizedEmail = (email || '').trim().toLowerCase();

  let lat: number | undefined;
  let lon: number | undefined;
  let geohash: string | undefined;

  try {
    const geo = await geocodeBusinessAddress({
      cep: userData.cep,
      street: userData.street,
      number: userData.number,
      neighborhood: userData.neighborhood,
      city: userData.city,
      state: userData.state,
      country: 'Brasil',
    });

    if (geo) {
      lat = geo.lat;
      lon = geo.lon;
      geohash = geohashForLocation([geo.lat, geo.lon]);
    }
  } catch (error) {
    console.warn('Falha ao resolver geolocalização no cadastro:', error);
  }

  const userPayload = {
    nome: userData.name,
    apelido: userData.nickname || '',
    email: normalizedEmail,
    telefone: userData.phone,
    cpf: userData.cpf,
    nivelAnunciante: 1, // Novo usuário sempre começa no nível 1
    criadoEm: new Date().toISOString(),
    favoritos: [],
    cep: userData.cep || '',
    rua: userData.street || '',
    numero: userData.number || '',
    bairro: userData.neighborhood || '',
    cidade: userData.city || '',
    estado: userData.state || '',
    ...(lat !== undefined ? { lat } : {}),
    ...(lon !== undefined ? { lon } : {}),
    ...(geohash ? { geohash } : {}),
  };

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const user = userCredential.user;

    try {
      // Salvar perfil na coleção padrão PT-BR
      await setDoc(doc(db, 'usuarios', user.uid), userPayload);
    } catch (firestoreError: any) {
      // Evita usuário órfão no Auth caso falhe ao persistir perfil no Firestore
      try {
        await deleteUser(user);
      } catch (rollbackError) {
        console.error('Falha no rollback de usuário órfão:', rollbackError);
      }

      if (auth.currentUser) {
        await signOut(auth).catch(() => undefined);
      }

      if (firestoreError?.code === 'permission-denied') {
        return {
          success: false,
          error: 'Sem permissão para salvar perfil em usuarios. Publique as regras atualizadas e tente novamente.'
        };
      }

      return {
        success: false,
        error: 'Conta criada no Auth, mas falhou ao salvar o perfil. Tente novamente.'
      };
    }

    return { success: true, user, uid: user.uid };
  } catch (error: any) {
    console.error('Erro no registerWithEmail:', error);
    
    // Mensagens personalizadas
    let errorMessage = 'Erro ao criar conta';
    
    if (error.code === 'auth/email-already-in-use') {
      // Recupera cenário de conta existente no Auth sem perfil em /usuarios
      try {
        const existingCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        const existingUser = existingCredential.user;
        const existingProfileRef = doc(db, 'usuarios', existingUser.uid);
        const existingProfile = await getDoc(existingProfileRef);

        if (!existingProfile.exists()) {
          await setDoc(existingProfileRef, userPayload);
          return {
            success: true,
            user: existingUser,
            uid: existingUser.uid,
            recoveredProfile: true,
          };
        }

        await signOut(auth).catch(() => undefined);
        errorMessage = 'Este e-mail já está cadastrado. Faça login.';
      } catch (recoveryError: any) {
        // Se a senha estiver diferente, mantém mensagem padrão de e-mail já existente
        if (auth.currentUser) {
          await signOut(auth).catch(() => undefined);
        }
        errorMessage = 'Este e-mail já está cadastrado. Faça login ou redefina sua senha.';
      }
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'E-mail inválido.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Senha muito fraca. Use no mínimo 6 caracteres.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
}

// Login com email/senha
export async function loginWithEmail(email: string, password: string) {
  try {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const user = userCredential.user;

    // Buscar dados do usuário no Firestore (coleção PT-BR)
    const userRef = doc(db, 'usuarios', user.uid);
    try {
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        // Recupera automaticamente perfil órfão quando houver conta no Auth sem doc em /usuarios
        try {
          const fallbackName = (user.email || normalizedEmail || '').split('@')[0] || 'USUARIO';
          const recoveredPayload = {
            nome: fallbackName.toUpperCase(),
            apelido: '',
            email: user.email || normalizedEmail,
            telefone: '',
            cpf: '',
            nivelAnunciante: 1,
            criadoEm: new Date().toISOString(),
            favoritos: [],
          };

          await setDoc(userRef, recoveredPayload);
          const recoveredDoc = await getDoc(userRef);

          if (recoveredDoc.exists()) {
            const recoveredUserData = mapUserFromFirestore(recoveredDoc.data());
            return { success: true, user, userData: recoveredUserData, recoveredProfile: true };
          }
        } catch (recoveryError: any) {
          console.error('Falha ao recuperar perfil ausente no login:', recoveryError);
        }

        // Se não conseguiu recuperar, encerra sessão parcial
        await signOut(auth);
        return {
          success: false,
          error: 'Perfil não encontrado e não foi possível recuperar automaticamente. Tente criar a conta novamente.'
        };
      }

      const userData = mapUserFromFirestore(userDoc.data());
      return { success: true, user, userData };
    } catch (firestoreReadError: any) {
      // Se a leitura do Firestore falhar (por exemplo regras negando leitura), permitimos o login
      // usando dados do Auth para não bloquear usuários legítimos.
      console.warn('Não foi possível ler perfil no Firestore durante o login:', firestoreReadError);
      const fallbackUserData: UserProfile = {
        name: (user.email || normalizedEmail || '').split('@')[0] || 'USUARIO',
        email: user.email || normalizedEmail,
        phone: '',
        cpf: '',
        anuncianteLevel: 1,
        createdAt: new Date().toISOString(),
      };
      return { success: true, user, userData: fallbackUserData };
    }
  } catch (error: any) {
    console.error('Erro no loginWithEmail:', error);
    
    // Mensagens personalizadas
    let errorMessage = 'Erro ao fazer login';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado. Crie uma conta primeiro.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Senha incorreta.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'E-mail inválido.';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'E-mail ou senha incorretos.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
}

// Solicitar redefinição de senha por e-mail
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = (email || '').trim();

    if (!normalizedEmail) {
      return { success: false, error: 'Informe seu e-mail para redefinir a senha.' };
    }

    await sendPasswordResetEmail(auth, normalizedEmail);
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao solicitar redefinição de senha:', error);

    let errorMessage = 'Não foi possível enviar o link de redefinição.';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Este e-mail não está cadastrado.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'E-mail inválido.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}

// Alterar senha dentro do app (exige senha atual)
export async function changePasswordWithCurrent(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;

    if (!user?.email) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    if (!currentPassword || !newPassword) {
      return { success: false, error: 'Informe a senha atual e a nova senha.' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);

    if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
      return { success: false, error: 'Senha atual incorreta.' };
    }

    return { success: false, error: error?.message || 'Não foi possível redefinir a senha.' };
  }
}

// Logout
export async function logout() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    const authError = error as AuthError;
    return { success: false, error: authError.message };
  }
}

// Listener para estado de autenticação
export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Buscar dados do usuário no Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'usuarios', uid));
    return userDoc.exists() ? mapUserFromFirestore(userDoc.data()) : null;
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }
}

// Atualizar dados do usuário
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    const mappedData = mapUserToFirestore(data);
    await setDoc(doc(db, 'usuarios', uid), mappedData, { merge: true });

    return { success: true };
  } catch (error) {
    const authError = error as AuthError;
    return { success: false, error: authError.message };
  }
}

// Atualiza apenas os campos de permissão/papel de um usuário (usado por Admins)
export async function setUserPermission(uid: string, papel: string) {
  try {
    const payload: Record<string, any> = {
      PERMISSAO: papel,
      permissao: papel,
      papel: papel,
    };
    await setDoc(doc(db, 'usuarios', uid), payload, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar permissão do usuário:', error);
    return { success: false, error: error.message };
  }
}

// Buscar todos os usuários cadastrados
export async function getAllUsers(): Promise<(UserProfile & { id: string })[]> {
  try {
    const collectionCandidates = ['usuarios', 'Usuarios', 'users', 'Users'];
    console.log('getAllUsers: iniciando tentativa de leitura de coleções candidatas', collectionCandidates);
    for (const col of collectionCandidates) {
      try {
        console.log(`getAllUsers: tentando ler coleção '${col}'`);
        const snap = await getDocs(collection(db, col));
        console.log(`getAllUsers: leitura '${col}' completa, documentos:`, snap.size);
        if (snap && snap.size > 0) {
          const users = snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...mapUserFromFirestore(docSnap.data()),
          }));
          console.log(`getAllUsers: encontrou usuários em '${col}', retornando ${users.length} registros`);
          return users;
        }
        // no documents in this collection
      } catch (innerErr) {
        console.warn(`getAllUsers: failed reading collection '${col}':`, innerErr);
      }
    }
    // no users found in any candidate collection
    return [];
  } catch (error) {
    console.error('Erro ao buscar usuários (outer):', error);
    return [];
  }
}

// Buscar favoritos do usuário
export async function getFavorites(uid: string): Promise<number[]> {
  try {
    const userDoc = await getDoc(doc(db, 'usuarios', uid));
    const data = userDoc.data();
    const raw = (data?.favoritos ?? data?.favorites ?? []) as any[];
    const normalized: number[] = (raw || [])
      .map((v) => {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string' && v.trim()) {
          const parsed = Number(v);
          if (Number.isFinite(parsed)) return parsed;
        }
        return null;
      })
      .filter((v): v is number => v !== null);

    return normalized;
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    return [];
  }
}

// Adicionar favorito
export async function addFavorite(uid: string, businessId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const userDoc = await getDoc(doc(db, 'usuarios', uid));
    const data = userDoc.data();
    const currentFavorites = (data?.favoritos as number[]) || (data?.favorites as number[]) || [];
    
    if (!currentFavorites.includes(businessId)) {
      await setDoc(
        doc(db, 'usuarios', uid),
        { favoritos: [...currentFavorites, businessId] },
        { merge: true }
      );
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao adicionar favorito:', error);
    return { success: false, error: error.message };
  }
}

// Remover favorito
export async function removeFavorite(uid: string, businessId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const userDoc = await getDoc(doc(db, 'usuarios', uid));
    const data = userDoc.data();
    const currentFavorites = (data?.favoritos as number[]) || (data?.favorites as number[]) || [];
    
    const updated = currentFavorites.filter((id) => id !== businessId);
    
    await setDoc(
      doc(db, 'usuarios', uid),
      { favoritos: updated },
      { merge: true }
    );
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao remover favorito:', error);
    return { success: false, error: error.message };
  }
}

// Retorna a contagem de favoritos para um negócio
export async function getFavoriteCount(businessId: number): Promise<number> {
  try {
    const q = query(collection(db, 'usuarios'), where('favoritos', 'array-contains', businessId));
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    console.error('Erro ao obter contagem de favoritos:', error);
    return 0;
  }
}

// Excluir conta do usuário e dados associados no Firestore
export async function deleteAccountAndData(currentPassword: string): Promise<{ success: boolean; error?: string; deletedAnuncios?: number }> {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser?.uid || !currentUser.email) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    if (!currentPassword) {
      return { success: false, error: 'Informe sua senha atual para confirmar a exclusão.' };
    }

    // Reautenticação antes da exclusão (requisito do Firebase Auth)
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);

    const uid = currentUser.uid;

    // Remove anúncios do usuário (compatível com campos legados)
    const anunciosByUsuarioId = await getDocs(
      query(collection(db, 'anuncios'), where('usuarioId', '==', uid))
    );

    const anunciosByUserId = await getDocs(
      query(collection(db, 'anuncios'), where('userId', '==', uid))
    );

    const refs = new Map<string, any>();
    anunciosByUsuarioId.forEach((d) => refs.set(d.id, d.ref));
    anunciosByUserId.forEach((d) => refs.set(d.id, d.ref));

    for (const ref of refs.values()) {
      await deleteDoc(ref);
    }

    // Remove documento de perfil (coleção PT-BR)
    await deleteDoc(doc(db, 'usuarios', uid));

    // Remove conta no Firebase Auth (pode exigir reautenticação)
    await deleteUser(currentUser);

    return { success: true, deletedAnuncios: refs.size };
  } catch (error: any) {
    console.error('Erro ao excluir conta e dados:', error);

    if (error?.code === 'auth/requires-recent-login') {
      return {
        success: false,
        error: 'Por segurança, faça login novamente e tente excluir a conta outra vez.',
        deletedAnuncios: 0
      };
    }

    if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
      return {
        success: false,
        error: 'Senha atual incorreta.',
        deletedAnuncios: 0
      };
    }

    return { success: false, error: error?.message || 'Falha ao excluir conta.', deletedAnuncios: 0 };
  }
}
