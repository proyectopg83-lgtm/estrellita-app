// src/components/PrivateStudentRoute.jsx
import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStudentSession } from "../services/studentAuth";

// Guard de estudiante SIN <Navigate/> en render para evitar bucles
export default function PrivateStudentRoute({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const redirectingRef = useRef(false);

  const session = getStudentSession();

  useEffect(() => {
    if (!session && !redirectingRef.current) {
      redirectingRef.current = true;
      // opcional: recuerda a dónde iba el alumno
      const next = encodeURIComponent(loc.pathname + loc.search);
      nav(`/login-estudiante?next=${next}`, { replace: true });
    }
  }, [session, nav, loc]);

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
