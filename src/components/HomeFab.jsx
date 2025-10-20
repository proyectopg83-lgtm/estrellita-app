import React from "react";
import { Link } from "react-router-dom";

export default function HomeFab({
  to = "/estudiante",
  title = "Volver al inicio",
  fixed = false,
  style = {},
  icon = "🏠",
}) {
  const baseBtn = {
    backgroundColor: "#f5f5f5",
    border: "none",
    borderRadius: "50%",
    padding: "0.6rem",
    cursor: "pointer",
    boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
    fontSize: 22,
    ...(fixed ? { position: "fixed", top: "1rem", left: "1rem", zIndex: 1000 } : {}),
    ...style,
  };

  return (
    <Link to={to} title={title} style={{ textDecoration: "none" }}>
      <button style={baseBtn}>{icon}</button>
    </Link>
  );
}
