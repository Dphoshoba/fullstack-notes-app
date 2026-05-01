import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "../api/auth.js";
import { AUTH_EXPIRED_EVENT, tokenStorage } from "../api/http.js";
import { updateMyProfile, updateUserSettings } from "../api/users.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!tokenStorage.get()) {
        setBooting(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch {
        tokenStorage.clear();
        setSessionExpired(true);
      } finally {
        setBooting(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setSessionExpired(true);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      sessionExpired,
      isAuthenticated: Boolean(user),
      async login(credentials) {
        const loggedInUser = await loginUser(credentials);
        setUser(loggedInUser);
        setSessionExpired(false);
      },
      async register(input) {
        const registeredUser = await registerUser(input);
        setUser(registeredUser);
        setSessionExpired(false);
      },
      async logout() {
        await logoutUser();
        setUser(null);
        setSessionExpired(false);
      },
      async updateProfile(input) {
        const updatedUser = await updateMyProfile(input);
        setUser(updatedUser);
        return updatedUser;
      },
      async updateSettings(input) {
        const updatedUser = await updateUserSettings(input);
        setUser(updatedUser);
        return updatedUser;
      }
    }),
    [booting, sessionExpired, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
