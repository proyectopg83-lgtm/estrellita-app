// src/pages/LoginStudent.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  loginStudentByCode,
  saveStudentSession,
} from "../services/studentAuth.js";

function normalizeCode(v = "") {
  return String(v).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export default function LoginStudent() {
  const nav = useNavigate();
  const [search] = useSearchParams();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const autoTried = useRef(false);

  const onChange = (e) => setCode(normalizeCode(e.target.value));

  async function doLogin(cleanCode) {
    setErr("");
    setLoading(true);
    try {
      const student = await loginStudentByCode(cleanCode);
      saveStudentSession(student);

      // Respeta 'next' si viene del guard
      const next = search.get("next");
      const dest = next && decodeURIComponent(next);
      if (dest && dest.startsWith("/estudiante")) {
        nav(dest, { replace: true });
      } else {
        nav("/estudiante", { replace: true });
      }
    } catch (ex) {
      setErr(ex?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!code) return;
    await doLogin(code);
  };

  // Autologin si viene ?code=... (por QR o enlace)
  useEffect(() => {
    if (autoTried.current) return;
    const qp = search.get("code");
    if (!qp) return;
    autoTried.current = true;
    const clean = normalizeCode(qp);
    if (!clean) return;
    setCode(clean);
    const t = setTimeout(() => doLogin(clean), 50);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
      }}
    >
      <div style={{ width: "min(460px, 92vw)", textAlign: "center" }}>
        <h1
          style={{
            margin: 0,
            marginBottom: 6,
            fontSize: "2.4rem",
            fontWeight: 800,
            color: "#223657",
            textShadow: "0 2px 0 rgba(0,0,0,0.06)",
          }}
        >
          👧👦 Ingreso Estudiante
        </h1>

        <p style={{ marginTop: 4, marginBottom: 18, color: "#4a5568", fontSize: "1.05rem" }}>
          Ingresa tu <b>código de alumno</b>.
        </p>

        <form
          onSubmit={onSubmit}
          style={{
            background: "rgba(255,255,255,.95)",
            backdropFilter: "blur(3px)",
            borderRadius: 18,
            padding: "18px 18px 20px",
            boxShadow: "0 10px 22px rgba(0,0,0,.10)",
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr",
              alignItems: "center",
              gap: 8,
              background: "#ffffff",
              border: "2px solid #b7e3ff",
              borderRadius: 12,
              padding: "10px 12px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 18 }}>🔐</span>
            <input
              type="text"
              value={code}
              onChange={onChange}
              placeholder="Ej: ESTA81C9"
              /* sin guiones; debe coincidir con BD */
              style={{
                border: "none",
                outline: "none",
                fontSize: "1rem",
                width: "100%",
                background: "transparent",
                textTransform: "uppercase",
              }}
              autoFocus
              required
              disabled={loading}
            />
          </div>

          {err && (
            <div style={{ color: "#c53030", fontWeight: 700, marginTop: -2, fontSize: ".95rem" }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code}
            style={{
              background: "#9BFF75",
              color: "#183b1a",
              border: "none",
              borderRadius: 12,
              padding: "12px 18px",
              fontWeight: 800,
              fontSize: "1.05rem",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 6px 12px rgba(0,0,0,.08)",
              transition: "transform .05s ease",
              fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>

          <Link
            to="/"
            style={{
              justifySelf: "center",
              textDecoration: "none",
              background: "#FFD54F",
              color: "#2a1f00",
              padding: "10px 16px",
              borderRadius: 12,
              fontWeight: 800,
              boxShadow: "0 6px 12px rgba(0,0,0,.08)",
              marginTop: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              opacity: loading ? 0.7 : 1,
              pointerEvents: loading ? "none" : "auto",
            }}
          >
            ⬅ Regresar al inicio
          </Link>
        </form>
      </div>
    </main>
  );
}
