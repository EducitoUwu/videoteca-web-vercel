import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBU_6gEkoKrt0jUgOy0VeN0yRPFqR06fO8",
    authDomain: "videoteca-enfermeria-dff21.firebaseapp.com",
    projectId: "videoteca-enfermeria-dff21",
    storageBucket: "videoteca-enfermeria-dff21.firebasestorage.app",
    messagingSenderId: "246137394891",
    appId: "1:246137394891:web:2e3f97bc7e970fff9fad4e"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);