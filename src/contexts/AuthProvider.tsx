import { createContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

interface BackendUser {
  id: number;
  email: string;
  fullName: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: BackendUser | null;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: async () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch("http://localhost:9999/api/v1/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const backendUser = await response.json();
            setUser(backendUser);
          } else {
            setUser(null);
            await signOut(auth);
          }
        } catch (err) {
          console.error("Error en onAuthStateChanged:", err);
          setUser(null);
          await signOut(auth);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
