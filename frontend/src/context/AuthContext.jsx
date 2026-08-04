import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../services/api";
const AuthContext = createContext(null);
const STORAGE_KEY = "bank-ledger-user";

function readStoredUser() {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function saveUser(user) {
  if (user) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

function extractUser(data, fallback) {
  if (data?.user) {
    return data.user;
  }

  if (data?.data?.user) {
    return data.data.user;
  }

  return fallback;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  async function login(payload) {
    const data = await api.login(payload);

    const authenticatedUser = extractUser(data, {
      name: data?.name || payload.email.split("@")[0],
      email: data?.email || payload.email,
    });

    setUser(authenticatedUser);
    saveUser(authenticatedUser);

    return data;
  }

  async function register(payload) {
    const data = await api.register(payload);

    const registeredUser = extractUser(data, {
      name: payload.name,
      email: payload.email,
    });

    setUser(registeredUser);
    saveUser(registeredUser);

    return data;
  }

  // async function logout() {
  //   try {
  //     await api.logout();
  //   } finally {
  //     setUser(null);
  //     saveUser(null);
  //   }
  // }

  async function logout() {
    try {
        await api.logout();
    } finally {
        sessionStorage.removeItem(
            "bank-ledger-access-token"
        );

        sessionStorage.removeItem(
            "bank-ledger-user"
        );

        setUser(null);
    }
}

  const value = useMemo(
    () => ({
      user,
      checking: false,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
