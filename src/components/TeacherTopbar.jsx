// src/components/TeacherTopbar.jsx
import React from "react";
import LogoutButton from "./LogoutButton.jsx";

export default function TeacherTopbar({ name, email, color = "#7aa2ff" }) {
  const initials = String(name || "?")
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: "min(96vw, 1200px)",
        margin: "0 auto 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: color,
            color: "#fff",
            fontWeight: 900,
            display: "grid",
            placeItems: "center",
            boxShadow: "0 6px 14px rgba(0,0,0,.12)",
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#1d3557" }}>{name || "Docente"}</div>
          <div style={{ fontSize: 12, color: "#516174" }}>{email}</div>
        </div>
      </div>
      <LogoutButton />
    </div>
  );
}
