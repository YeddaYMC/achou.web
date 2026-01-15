import {
    AuthError,
    createUserWithEmailAndPassword,
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User
} from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import app from '../../firebaseConfig.js';

const auth = getAuth(app);
const db = getFirestore(app);

// Interface para perfil de usuário
export interface UserProfile {
  name: string;
  nickname?: string;
  email: string;
  phone: string;
  cpf: string;
  anuncianteLevel: 1 | 2 | 3 | 4;
  createdAt: string;
}

// Registrar novo usuário com email/senha
export async function registerWithEmail(
  email: string,
  password: string,
  userData: Omit<UserProfile, 'createdAt'>
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Salvar dados adicionais no Firestore
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      email,
      anuncianteLevel: 1, // Novo usuário sempre começa no nível 1
      createdAt: new Date().toISOString(),
      favorites: [],
    });

    return { success: true, user, uid: user.uid };
  } catch (error: any) {
    console.error('Erro no registerWithEmail:', error);
    
    // Mensagens personalizadas
    let errorMessage = 'Erro ao criar conta';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este e-mail já está cadastrado. Faça login.';
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Buscar dados do usuário no Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data() as UserProfile | undefined;

    return { success: true, user, userData };
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
    const userDoc = await getDoc(doc(db, 'users', uid));
    return (userDoc.data() as UserProfile) || null;
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }
}

// Atualizar dados do usuário
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
    return { success: true };
  } catch (error) {
    const authError = error as AuthError;
    return { success: false, error: authError.message };
  }
}

// Buscar favoritos do usuário
export async function getFavorites(uid: string): Promise<number[]> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return (userDoc.data()?.favorites as number[]) || [];
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    return [];
  }
}

// Adicionar favorito
export async function addFavorite(uid: string, businessId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    const currentFavorites = (userDoc.data()?.favorites as number[]) || [];
    
    if (!currentFavorites.includes(businessId)) {
      await setDoc(
        doc(db, 'users', uid),
        { favorites: [...currentFavorites, businessId] },
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
    const userDoc = await getDoc(doc(db, 'users', uid));
    const currentFavorites = (userDoc.data()?.favorites as number[]) || [];
    
    const updated = currentFavorites.filter((id) => id !== businessId);
    
    await setDoc(
      doc(db, 'users', uid),
      { favorites: updated },
      { merge: true }
    );
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao remover favorito:', error);
    return { success: false, error: error.message };
  }
}
