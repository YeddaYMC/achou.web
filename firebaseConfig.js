import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { Platform } from "react-native";

// Configuração obtida no console do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDrbABiBqPsZze89LL9vKpliPDjsIQeVcw",
  authDomain: "achou-android.firebaseapp.com",
  projectId: "achou-android",
  storageBucket: "achou-android.firebasestorage.app",
  messagingSenderId: "589119071964",
  appId: "1:589119071964:web:7af95b9f42318f5fd77619",
  measurementId: "G-0SFTJD15C5",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

let auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Se já inicializado em outro ponto, reutiliza a instância existente.
    auth = getAuth(app);
  }
}

export { auth };
export default app;
