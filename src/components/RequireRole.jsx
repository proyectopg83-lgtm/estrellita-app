// src/components/RequireRole.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth.jsx";

/**
 * Protege rutas por rol.
 * Uso:
 *   <Route element={<RequireRole allow={['teacher']} />}>
 *     ...rutas del docente...
 *   </Route>
 */
export default function RequireRole({ allow = [] }) {
  const { user, role } = useAuth();

  // No logueado
  if (!user) return <Navigate to="/login" replace />;

  // Si no hay restricción, deja pasar
  if (!allow || allow.length === 0) return <Outlet />;

  // Verifica rol
  if (!role || !allow.includes(role)) {
    // Sin permiso → a inicio o a una página 403 si tienes
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
