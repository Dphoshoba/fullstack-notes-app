import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "../api/auth.js";
import { tokenStorage } from "../api/http.js";
import { updateMyProfile } from "../api/users.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

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
      } finally {
        setBooting(false);
      }
    };

    loadUser();
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthenticated: Boolean(user),
      async login(credentials) {
        const loggedInUser = await loginUser(credentials);
        setUser(loggedInUser);
      },
      async register(input) {
        const registeredUser = await registerUser(input);
        setUser(registeredUser);
      },
      async logout() {
        await logoutUser();
        setUser(null);
      },
      async updateProfile(input) {
        const updatedUser = await updateMyProfile(input);
        setUser(updatedUser);
        return updatedUser;
      }
    }),
    [booting, user]
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
