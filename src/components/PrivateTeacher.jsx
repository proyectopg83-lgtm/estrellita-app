import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function PrivateTeacher({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: 16 }}>Cargando…</p>;
  if (!user) return <Navigate to="/login-docente" replace />;
  return children;
}
