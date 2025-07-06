import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBDIAZ1_Wb_HmHzlDUqT0BepqKT9qqI2Dg",
  authDomain: "clinic-hub-e56fd.firebaseapp.com",
  projectId: "clinic-hub-e56fd",
  storageBucket: "clinic-hub-e56fd.firebasestorage.app",
  messagingSenderId: "970655458951",
  appId: "1:970655458951:web:3ac3992aba7d3a9f87ba22",
  measurementId: "G-WVT19DT4EZ"
};
  

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);



