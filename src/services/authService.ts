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
  email: string;
  phone: string;
  cpf: string;
  isPremium: boolean;
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
      createdAt: new Date().toISOString(),
    });

    return { success: true, user, uid: user.uid };
  } catch (error) {
    const authError = error as AuthError;
    return { success: false, error: authError.message };
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
  } catch (error) {
    const authError = error as AuthError;
    return { success: false, error: authError.message };
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
