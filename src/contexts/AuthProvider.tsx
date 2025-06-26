import { createContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

interface BackendUser {
  id: number;
  email: string;
  fullName: string;
  role: "admin" | "user" | "estudiante";
}

interface AuthContextType {
  user: BackendUser | null;
  accessToken: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  loading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let triedRefresh = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);

      if (firebaseUser) {
        // Usuario autenticado con Firebase, login normal con backend
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch("http://localhost:9999/api/v1/auth/login", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const result = await response.json();
            setUser(result.data.user);
            setAccessToken(result.data.accessToken);
            localStorage.setItem("accessToken", result.data.accessToken);
            localStorage.setItem("refreshToken", result.data.refreshToken);
            
          } else {
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            await signOut(auth);
          }
        } catch (err) {
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          await signOut(auth);
        }
        setLoading(false);
      } else {
        // No usuario de Firebase, intenta refrescar con refreshToken del backend (solo una vez)
        if (!triedRefresh) {
          triedRefresh = true;
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            console.log("Intentando refrescar sesión con refreshToken:", refreshToken);
            try {
              const response = await fetch("http://localhost:9999/api/v1/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
              });
              if (response.ok) {
                const result = await response.json();
                setUser(result.data.user);
                setAccessToken(result.data.accessToken);
                localStorage.setItem("accessToken", result.data.accessToken);
                if (result.data.refreshToken) {
                  localStorage.setItem("refreshToken", result.data.refreshToken);
                }
              } else {
                setUser(null);
                setAccessToken(null);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
              }
            } catch {
              setUser(null);
              setAccessToken(null);
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
            }
          } else {
            setUser(null);
            setAccessToken(null);
          }
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};