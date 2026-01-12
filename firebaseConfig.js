import { initializeApp } from "firebase/app";

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

export default app;
