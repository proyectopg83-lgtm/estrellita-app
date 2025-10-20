// src/pages/LoginTeacher.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn, getProfilesAfterAuth } from "../services/auth";

export default function LoginTeacher() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const E = String(email || "").trim().toLowerCase();
      await signIn({ email: E, password: pass });

      // Verificar perfil/rol inmediatamente después del login
      const { role: r } = await getProfilesAfterAuth();
      if (r === "teacher") {
        nav("/docente", { replace: true });
      } else {
        setError("Tu usuario no está vinculado como docente.");
      }
    } catch (err) {
      const msg = String(err?.message || "").toLowerCase();
      if (msg.includes("invalid") || msg.includes("contraseña")) {
        setError("Credenciales inválidas.");
      } else if (msg.includes("confirm")) {
        setError("Debes confirmar tu correo antes de ingresar.");
      } else {
        setError(err?.message || "No se pudo iniciar sesión");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ width: "min(460px, 92vw)", textAlign: "center" }}>
        <h1 style={{ margin: 0, marginBottom: 6, fontSize: "2.4rem", fontWeight: 800, color: "#223657" }}>
          👩‍🏫 Ingreso Docente
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "rgba(255,255,255,.95)",
            borderRadius: 18,
            padding: "18px 18px 20px",
            boxShadow: "0 10px 22px rgba(0,0,0,.10)",
            display: "grid",
            gap: 12,
            marginTop: 12,
          }}
        >
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={busy}
            style={{ padding: "12px", border: "2px solid #b7e3ff", borderRadius: 12, fontSize: "1rem" }}
          />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Contraseña"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
            disabled={busy}
            style={{ padding: "12px", border: "2px solid #b7e3ff", borderRadius: 12, fontSize: "1rem" }}
          />

          {error && (
            <div style={{ color: "#c53030", fontWeight: 700, marginTop: 2 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              background: "#90D9FF",
              color: "#002244",
              border: "none",
              borderRadius: 12,
              padding: "12px 18px",
              fontWeight: 800,
              fontSize: "1.05rem",
              cursor: busy ? "not-allowed" : "pointer",
              boxShadow: "0 6px 12px rgba(0,0,0,.08)",
              marginTop: 6,
              opacity: busy ? 0.7 : 1,
              fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
            }}
          >
            {busy ? "Procesando…" : "Entrar"}
          </button>
        </form>

        <Link
          to="/"
          style={{
            display: "inline-block",
            marginTop: 16,
            textDecoration: "none",
            background: "#FFD54F",
            color: "#2a1f00",
            padding: "10px 16px",
            borderRadius: 12,
            fontWeight: 800,
          }}
        >
          ⬅ Regresar al inicio
        </Link>
      </div>
    </main>
  );
}
