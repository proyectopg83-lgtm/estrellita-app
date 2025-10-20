// src/pages/teacher/TeacherProfile.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth.jsx";
import { useNavigate } from "react-router-dom";
import { getMyTeacher, updateMyTeacher } from "../../services/teachers.js";

export default function TeacherProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      if (!user) return;
      const t = await getMyTeacher().catch(() => null);
      setTeacher(t);
      setFullName(t?.full_name || "");
      setEmail(t?.email || user.email || "");
      setLoading(false);
    })();
  }, [user]);

  async function onSave(e) {
    e.preventDefault();
    try {
      const t = await updateMyTeacher({
        full_name: fullName.trim(),
        email: email.trim(),
      });
      setTeacher(t);
      alert("✅ Perfil actualizado correctamente");
    } catch (err) {
      alert(err?.message || "❌ No se pudo actualizar el perfil");
    }
  }

  if (loading) {
    return (
      <main style={{ padding: 24, textAlign: "center" }}>
        Cargando perfil…
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "30px 40px",
          width: "min(680px, 92vw)",
          boxShadow: "0 8px 20px rgba(0,0,0,.08)",
        }}
      >
        <h2
          style={{
            color: "#0d47a1",
            fontWeight: 800,
            marginBottom: 20,
            textAlign: "left",
          }}
        >
          Perfil del docente
        </h2>

        <div style={{ marginBottom: 18, lineHeight: 1.6 }}>
          <p>
            <b>ID docente:</b>
            <br />
            {teacher?.id || "—"}
          </p>
        </div>

        <form onSubmit={onSave} style={{ display: "grid", gap: 12 }}>
          <label style={{ fontWeight: 800, color: "#223" }}>
            Nombre completo
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej: María Pérez"
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1.5px solid #e3e9f3",
            }}
          />

          <label style={{ fontWeight: 800, color: "#223" }}>Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1.5px solid #e3e9f3",
            }}
          />

          <button
            type="submit"
            style={{
              marginTop: 8,
              background: "#90D9FF",
              color: "#012a44",
              border: "none",
              borderRadius: 12,
              padding: "12px 18px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 6px 12px rgba(0,0,0,.08)",
            }}
          >
            Guardar
          </button>
        </form>

        {/* 🔙 Botón de regresar estilo Roster */}
        <div style={{ textAlign: "center", marginTop: 25 }}>
          <button
            onClick={() => navigate("/docente")}
            style={{
              backgroundColor: "#FFD54F",
              border: "none",
              borderRadius: "12px",
              padding: "10px 20px",
              color: "#212121",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                background: "#03A9F4",
                color: "white",
                borderRadius: "6px",
                padding: "4px 6px",
                fontSize: "0.9rem",
                lineHeight: "1rem",
              }}
            >
              ←
            </span>
            Volver
          </button>
        </div>
      </div>
    </main>
  );
}
