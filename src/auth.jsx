// src/auth.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChange, getCurrentUser, signOut, getProfilesAfterAuth } from "./services/auth";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [role, setRole] = useState(null); // "teacher" | "student" | null
  const [loading, setLoading] = useState(true);

  async function syncProfiles() {
    const { user: u, role: r, student: s, teacher: t } = await getProfilesAfterAuth();
    setUser(u ?? null);
    setStudent(s ?? null);
    setTeacher(t ?? null);
    setRole(r ?? null);
  }

  useEffect(() => {
    let unsub = () => {};
    let mounted = true;

    (async () => {
      try {
        const u = await getCurrentUser().catch(() => null);
        if (u) await syncProfiles();
      } finally {
        if (mounted) setLoading(false);
      }
      unsub = onAuthStateChange(async (u) => {
        if (!mounted) return;
        if (u) await syncProfiles();
        else { setUser(null); setStudent(null); setTeacher(null); setRole(null); }
      });
    })();

    return () => { mounted = false; try { unsub(); } catch {} };
  }, []);

  const value = useMemo(() => ({
    user, student, teacher, role, loading,
    logout: async () => { await signOut(); setUser(null); setStudent(null); setTeacher(null); setRole(null); }
  }), [user, student, teacher, role, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
