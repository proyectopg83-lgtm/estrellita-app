// src/pages/StudentHome.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getStudentSession,
  logoutStudent, // logout completo (local + Supabase + replace)
} from "../services/studentAuth.js";

import StudentCodeQR from "../components/StudentCodeQR.jsx";

function fullName(s) {
  const fn = (s?.first_name || "").trim();
  const ln = (s?.last_name || "").trim();
  return [fn, ln].filter(Boolean).join(" ") || "estudiante";
}

export default function StudentHome() {
  const [student, setStudent] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  //  la redirección la maneja el guard PrivateStudent
  useEffect(() => {
    const s = getStudentSession();
    setStudent(s);
  }, []);

  // Si se monta sin sesión (acceso directo), mostramos un skeleton breve
  if (!student) {
    return <div style={{ padding: 24, textAlign: "center" }}>Cargando…</div>;
  }

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      setShowQR(false);     // cierra modal si estaba abierto
      setStudent(null);     // evita render mientras se sale
      await logoutStudent(); // hace location.replace("/login-estudiante")
    } finally {
      // no usamos nav aquí; logoutStudent ya redirige con replace
    }
  };

  return (
    <main
      className="student-home"
      style={{
        minHeight: "100vh",
        fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
      }}
    >
      {/* Barra superior */}
      <header className="sh-bar" style={{ padding: "18px 0" }}>
        <div
          style={{
            width: "min(92vw, 960px)",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h1 className="sh-hello" style={{ margin: 0, fontSize: "2.2rem" }}>
            👋 ¡Hola, <b>{fullName(student)}</b>!
          </h1>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowQR(true)}
              style={{
                background: "#daff82ff",
                border: "none",
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 6px 12px rgba(0,0,0,.08)",
                fontFamily:
                  '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
              }}
              title="Mostrar tu código como QR"
            >
              🧾 Mostrar código
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              style={{
                background: "#FFD54F",
                border: "none",
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 800,
                cursor: isLoggingOut ? "not-allowed" : "pointer",
                boxShadow: "0 6px 12px rgba(0,0,0,.08)",
                fontFamily:
                  '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
                opacity: isLoggingOut ? 0.7 : 1,
              }}
              title="Cerrar sesión"
            >
              {isLoggingOut ? "Saliendo…" : "🔒 Cerrar sesión"}
            </button>
          </div>
        </div>
      </header>

      {/* Indicaciones */}
      <p
        className="sh-intro"
        style={{
          width: "min(92vw, 960px)",
          margin: "0 auto 16px",
          color: "#334155",
          fontSize: "1.1rem",
        }}
      >
        Selecciona una opción para comenzar a aprender:
      </p>

      {/* Tarjetas */}
      <section
        className="sh-grid"
        style={{
          width: "min(92vw, 960px)",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        <Link to="/estudiante/letras/o" className="card" style={cardStyle}>
          <div style={emojiStyle}>🔤</div>
          <div style={titleStyle}>Letras</div>
          <div style={subStyle}>
            Reconoce letras, su sonido y una palabra.
          </div>
        </Link>

        <Link to="/estudiante/silabas/m" className="card" style={cardStyle}>
          <div style={emojiStyle}>🔊</div>
          <div style={titleStyle}>Sílabas</div>
          <div style={subStyle}>ma · me · mi · mo · mu</div>
        </Link>

        <Link to="/estudiante/oraciones/m" className="card" style={cardStyle}>
          <div style={emojiStyle}>📖</div>
          <div style={titleStyle}>Oraciones</div>
          <div style={subStyle}>
            Aprende a leer oraciones completas con imágenes.
          </div>
        </Link>

        <Link
          to="/estudiante/oraciones/cuento-1"
          className="card"
          style={cardStyle}
        >
          <div style={emojiStyle}>📚</div>
          <div style={titleStyle}>Cuentos</div>
          <div style={subStyle}>Lee textos cortos con tu voz.</div>
        </Link>
      </section>

      {/* Footer simple */}
      <footer
        className="sh-foot"
        style={{
          width: "100%",
          textAlign: "center",
          padding: "22px 0 28px",
          color: "#334155",
        }}
      >
        Sistema “Método Estrellita” — Aprende jugando y leyendo.
      </footer>

      {/* Modal QR */}
      {showQR && (
        <StudentCodeQR code={student.student_code} onClose={() => setShowQR(false)} />
      )}
    </main>
  );
}

/* ——— estilos inline reutilizados ——— */
const cardStyle = {
  textDecoration: "none",
  background: "#fff",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 10px 22px rgba(0,0,0,.08)",
  display: "grid",
  gap: 6,
  color: "#0f172a",
};
const emojiStyle = { fontSize: 28, lineHeight: 1 };
const titleStyle = { fontSize: "1.2rem", fontWeight: 800 };
const subStyle = { color: "#475569", fontSize: ".98rem" };
