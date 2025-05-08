import { createContext, useState, useEffect, ReactNode } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

interface AuthContextType {
  user: User | null;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const ucnRegex = /@([a-zA-Z0-9-]+\.)*ucn\.cl$/;
      if (
        firebaseUser &&
        firebaseUser.email &&
        ucnRegex.test(firebaseUser.email)
      ) {
        setUser(firebaseUser);
      } else {
        setUser(null);
        if (firebaseUser) {
          localStorage.setItem("ucn-alert", "1");
          await signOut(auth);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
