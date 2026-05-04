import { useEffect, useMemo, useState } from "react";
import {
  clearAdminSession,
  getCurrentAdmin,
  getStoredAdminSession,
  loginAdmin,
  storeAdminSession,
} from "../../services/api";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredAdminSession());
  const [loading, setLoading] = useState(Boolean(getStoredAdminSession()?.token));

  useEffect(() => {
    let mounted = true;
    const storedSession = getStoredAdminSession();

    if (!storedSession?.token) {
      return () => {
        mounted = false;
      };
    }

    getCurrentAdmin()
      .then((res) => {
        if (!mounted) return;
        const nextSession = {
          ...storedSession,
          user: res.data.data.user,
        };
        storeAdminSession(nextSession);
        setSession(nextSession);
      })
      .catch(() => {
        clearAdminSession();
        if (mounted) setSession(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function login(credentials) {
    const res = await loginAdmin(credentials);
    const nextSession = res.data.data;
    storeAdminSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }

  function logout() {
    clearAdminSession();
    setSession(null);
  }

  const value = useMemo(
    () => ({
      user: session?.user || null,
      token: session?.token || "",
      loading,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
