import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function LogoutButton() {
  const { logout } = useAuth();
  const nav = useNavigate();

  const handleClick = () => {
    // Limpia sesión
    logout();
    // Redirige siempre al inicio principal
    nav("/", { replace: true });
  };

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: "#FFD54F",          
        border: "none",
        borderRadius: "30px",               
        padding: "0.6rem 1rem",
        fontWeight: 600,
        boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',

      }}
      onMouseEnter={(e) => (e.target.style.backgroundColor = "#FFEE82")}
      onMouseLeave={(e) => (e.target.style.backgroundColor = "#FFD54F")}
    >
      🚪 Cerrar sesión
    </button>
  );
}
