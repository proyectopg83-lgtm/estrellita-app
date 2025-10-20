// src/pages/admin/Admin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth.jsx";
import {
  listTeachers,
  addTeacher,
  updateTeacher,
  removeTeacher,
} from "../../mock/localAccess.js";

export default function Admin() {
  const { user, logout } = useAuth();

  // ====== estado base ======
  const [teachers, setTeachers] = useState([]);
  const refresh = () => setTeachers(listTeachers());
  useEffect(() => { refresh(); }, []);

  // ====== búsqueda ======
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return teachers;
    return teachers.filter(t =>
      (t.teacherId || "").toLowerCase().includes(s) ||
      (t.name || "").toLowerCase().includes(s) ||
      (t.email || "").toLowerCase().includes(s)
    );
  }, [teachers, q]);

  // ====== formulario (crear/editar) ======
  // mode: "none" | "create" | "edit"
  const [mode, setMode] = useState("none");
  const [form, setForm] = useState({
    teacherId: "",
    name: "",
    email: "",
    password: "123456",
    role: "teacher",
  });
  const [err, setErr] = useState("");

  function openCreate() {
    setErr("");
    setForm({ teacherId: "", name: "", email: "", password: "123456", role: "teacher" });
    setMode("create");
  }
  function openEdit(t) {
    setErr("");
    setForm({
      teacherId: t.teacherId || "",
      name: t.name || "",
      email: t.email || "",
      password: t.password || "123456",
      role: t.role || "teacher",
    });
    setMode("edit");
  }
  function closeForm() {
    setMode("none");
    setErr("");
  }

  function onChange(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "create") {
        await addTeacher({
          teacherId: form.teacherId.trim() || undefined, // opcional: si vacío, se autogenera
          email: form.email.trim().toLowerCase(),
          name: form.name.trim(),
          password: form.password,
          role: form.role || "teacher",
        });
      } else if (mode === "edit") {
        // EDITAMOS POR teacherId (clave estable)
        await updateTeacher(form.teacherId, {
          email: form.email.trim().toLowerCase(),
          name: form.name.trim(),
          password: form.password,
          role: form.role || "teacher",
        });
      }
      refresh();
      closeForm();
      alert("✅ Cambios guardados");
    } catch (ex) {
      setErr(ex?.message || "No se pudo guardar.");
      alert("❌ " + (ex?.message || "No se pudo guardar."));
    }
  }

  function onDelete(t) {
    if (!confirm(`¿Eliminar al docente "${t.name}" (${t.teacherId})?`)) return;
    const ok = removeTeacher(t.teacherId);
    if (!ok) {
      alert("No se pudo eliminar.");
      return;
    }
    refresh();
  }

  // ====== estilos base ======
  const card = {
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 12px 28px rgba(0,0,0,.08)",
  };
  const input = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "2px solid #dfe7f1",
    outline: "none",
    fontSize: "1rem",
    background: "#fafcfe",
  };
  const btn = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 16,
        background: "linear-gradient(to bottom, #cce9ff, #f9fff5)",
        fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#1d3557", fontWeight: 800 }}>
            🛠️ Panel de Administración
          </h2>
          <p style={{ margin: 0, color: "#445" }}>
            Sesión: <b>{user?.name || "Admin"}</b> ({user?.email})
          </p>
        </div>
        <button
          onClick={() => { logout(); /* redirección la hace tu LogoutButton o rutas */ }}
          style={{ ...btn, background: "#FFD54F", color: "#2a1f00" }}
          title="Cerrar sesión"
        >
          🚪Cerrar sesión
        </button>
      </header>

      {/* barra superior: búsqueda + acción */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, correo o ID…"
          style={input}
        />
        <button
          onClick={openCreate}
          style={{ ...btn, background: "#9BFF75", color: "#134a16" }}
        >
          ➕ Agregar docente
        </button>
      </div>

      {/* formulario crear/editar */}
      {mode !== "none" && (
        <div style={{ ...card, marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h3 style={{ margin: 0, color: "#223" }}>
              {mode === "create" ? "➕ Nuevo docente" : "✏️ Editar docente"}
            </h3>
            <button
              onClick={closeForm}
              style={{
                background: "transparent",
                border: "none",
                fontWeight: 900,
                cursor: "pointer",
              }}
              title="Cerrar"
            >
              ✖ Cerrar
            </button>
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <div>
                <label style={{ fontWeight: 800, color: "#263238" }}>ID</label>
                <input
                  placeholder="(auto) ej. TABC1"
                  value={form.teacherId}
                  onChange={(e) => onChange("teacherId", e.target.value)}
                  style={{ ...input, background: mode === "edit" ? "#f3f6fb" : "#fafcfe" }}
                  disabled={mode === "edit"} // no permitir cambiar la clave
                />
              </div>
              <div>
                <label style={{ fontWeight: 800, color: "#263238" }}>Nombre</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  style={input}
                />
              </div>
              <div>
                <label style={{ fontWeight: 800, color: "#263238" }}>Correo</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  style={input}
                />
              </div>
              <div>
                <label style={{ fontWeight: 800, color: "#263238" }}>
                  Contraseña
                </label>
                <input
                  required
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  style={input}
                />
              </div>
              <div>
                <label style={{ fontWeight: 800, color: "#263238" }}>Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => onChange("role", e.target.value)}
                  style={input}
                >
                  <option value="teacher">Docente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {err && (
              <div
                style={{
                  background: "#ffe8e8",
                  border: "1px solid #ffc7c7",
                  color: "#7a0c0c",
                  padding: "10px 12px",
                  borderRadius: 12,
                  fontWeight: 700,
                }}
              >
                {err}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" style={{ ...btn, background: "#90D9FF", color: "#002244" }}>
                Guardar
              </button>
              <button
                type="button"
                onClick={closeForm}
                style={{
                  ...btn,
                  background: "#fff",
                  border: "1.5px solid #e0e7ef",
                  color: "#223",
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* tabla */}
      <div style={{ ...card, overflowX: "auto" }}>
        {!filtered.length ? (
          <p style={{ margin: 0, color: "#555" }}>
            {teachers.length ? "No hay resultados para tu búsqueda." : "Aún no hay docentes registrados."}
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #e9eef5",
                  color: "#1f2937",
                }}
              >
                <th style={{ padding: 10 }}>ID</th>
                <th style={{ padding: 10 }}>Nombre</th>
                <th style={{ padding: 10 }}>Correo</th>
                <th style={{ padding: 10 }}>Rol</th>
                <th style={{ padding: 10 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => (
                <tr
                  key={t.teacherId}
                  style={{
                    borderBottom: "1px solid #f1f5fb",
                    background: idx % 2 ? "#fcfdff" : "white",
                  }}
                >
                  <td style={{ padding: 10, fontFamily: "monospace" }}>{t.teacherId}</td>
                  <td style={{ padding: 10 }}>{t.name}</td>
                  <td style={{ padding: 10 }}>{t.email}</td>
                  <td style={{ padding: 10 }}>{t.role || "teacher"}</td>
                  <td style={{ padding: 10 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => openEdit(t)}
                        style={{
                          ...btn,
                          background: "#e6f0ff",
                          color: "#0b3b58",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(t)}
                        style={{
                          ...btn,
                          background: "#ffdddd",
                          color: "#6a1b1b",
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
