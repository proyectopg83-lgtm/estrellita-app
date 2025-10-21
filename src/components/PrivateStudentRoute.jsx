// src/components/PrivateStudentRoute.jsx
import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStudentSession } from "../services/studentAuth";

// Guard de estudiante SIN <Navigate/> en render para evitar bucles
export default function PrivateStudentRoute({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const redirectedForKeyRef = useRef(null);

  const session = getStudentSession();

  // ¿Estamos ya en una ruta de login?
  const isOnLogin =
    loc.pathname.startsWith("/login-estudiante") ||
    loc.pathname.startsWith("/login-student");

  useEffect(() => {
    if (session) return;           
    if (isOnLogin) return;          

    // Evita redirigir más de una vez por la misma "key" de ubicación
    if (redirectedForKeyRef.current === loc.key) return;
    redirectedForKeyRef.current = loc.key;

    const next = encodeURIComponent(loc.pathname + loc.search);
    nav(`/login-estudiante?next=${next}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isOnLogin, loc.key]);

  if (!session) {
    // Muestra algo liviano mientras redirige (evita re-renders infinitos)
    return (
      <div className="container" style={{ padding: 24, textAlign: "center" }}>
        Cargando…
      </div>
    );
  }

  return children;
}
