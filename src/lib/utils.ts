import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { auth } from "../firebaseConfig";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getFirebaseToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
}

// Usa el accessToken del backend guardado en localStorage
export async function backendAuthFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("No autenticado");

  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

// Mantén authFetch si necesitas peticiones autenticadas con Firebase
export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = await getFirebaseToken();
  if (!token) throw new Error("No autenticado");

  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}