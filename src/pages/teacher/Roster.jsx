import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth.jsx";

import {
  getStudentsByCurrentTeacher,
  createStudentManual as createStudentManualSvc,
  updateStudentStatus as updateStudentStatusSvc,
  removeStudent as removeStudentSvc,
  updateStudentInfo as updateStudentInfoSvc,
} from "../../services/students.js";

/**  Formato de fecha (YYYY-MM-DD → DD/MM/YYYY) */
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
}

/**  Divide nombre completo → { first_name, last_name } */
function splitName(full) {
  const parts = String(full || "").trim().split(/\s+/);
  const first_name = parts.shift() || "";
  const last_name = parts.join(" ");
  return { first_name, last_name };
}

/**  Módulo principal: Roster de alumnos del docente actual */
export default function Roster() {
  const { user } = useAuth();
  const nav = useNavigate();

  // === Estado principal ===
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // === Estados de formulario ===
  const [displayName, setDisplayName] = useState("");
  const [section, setSection] = useState("A");
  const [dob, setDob] = useState("");
  const [err, setErr] = useState("");
  const [lastCode, setLastCode] = useState("");

  // === Estados de edición ===
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSection, setEditSection] = useState("A");
  const [editDob, setEditDob] = useState("");

  /**  Carga inicial de alumnos */
  const refresh = async () => {
    setLoading(true);
    try {
      const rows = await getStudentsByCurrentTeacher();
      setStudents(rows);
    } catch (e) {
      console.error(e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  /**  Limpia el formulario */
  function clearForm() {
    setDisplayName("");
    setSection("A");
    setDob("");
    setErr("");
    setLastCode("");
  }

  /**  Registrar nuevo alumno */
  async function onCreate(e) {
    e.preventDefault();
    setErr("");
    try {
      const { first_name, last_name } = splitName(displayName);
      const created = await createStudentManualSvc({
        first_name,
        last_name,
        grade: section,
        dob: dob || null,
      });
      setLastCode(created?.student_code || ""); // la BD lo genera automáticamente
      await refresh();
      clearForm();
    } catch (ex) {
      setErr(ex?.message || "No se pudo registrar al alumno.");
    }
  }

  /**  Cambiar estado  */
  async function onToggle(uid, status) {
    try {
      await updateStudentStatusSvc({
        id: uid,
        status: status === "active" ? "blocked" : "active",
      });
      await refresh();
    } catch (e) {
      console.error(e);
    }
  }

  /**  Eliminar alumno */
  async function onRemove(uid) {
    if (!confirm("¿Deseas eliminar este alumno?")) return;
    try {
      await removeStudentSvc(uid);
      await refresh();
    } catch (e) {
      console.error(e);
    }
  }

  /**  Cargar datos del alumno en edición */
  useEffect(() => {
    if (editing) {
      setEditName(`${editing.first_name || ""} ${editing.last_name || ""}`);
      setEditSection(editing.grade || "A");
      setEditDob(editing.dob || "");
    }
  }, [editing]);

  /**  Guardar edición */
  async function handleSaveEdit() {
    try {
      const { first_name, last_name } = splitName(editName);
      await updateStudentInfoSvc({
        id: editing.id,
        first_name,
        last_name,
        grade: editSection,
        dob: editDob || null,
      });
      setEditing(null);
      await refresh();
    } catch (e) {
      alert("Error al guardar: " + (e?.message || e));
    }
  }

  /**  Filtro de búsqueda */
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter(
      (s) =>
        s.first_name?.toLowerCase().includes(q) ||
        s.last_name?.toLowerCase().includes(q) ||
        s.student_code?.toLowerCase().includes(q)
    );
  }, [students, query]);

  // === Estilos base reutilizables ===
  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #d0e0f5",
    fontSize: "1rem",
  };
  const buttonStyle = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
  };

  // === Render principal ===
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 16,
        background: "linear-gradient(to bottom, #bde3ff, #eaf7ff)",
      }}
    >
      {/* Encabezado */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, color: "#1d3557", fontWeight: 800 }}>
          👥 Alumnos del docente
        </h2>
        <button
          onClick={() => nav("/docente")}
          style={{
            ...buttonStyle,
            background: "#FFD54F",
            color: "#2a1f00",
            boxShadow: "0 4px 10px rgba(0,0,0,.1)",
            fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',

          }}
        >
          ⬅️ Volver
        </button>
      </header>

      {/* Formulario de registro */}
      <form
        onSubmit={onCreate}
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 16,
          boxShadow: "0 6px 16px rgba(0,0,0,.08)",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <input
            required
            placeholder="Nombre completo"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={inputStyle}
          />
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            style={inputStyle}
          >
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={inputStyle}
          />
        </div>

        {err && (
          <p style={{ color: "#b00020", fontWeight: 700 }}>{err}</p>
        )}

        <button
          type="submit"
          style={{
            ...buttonStyle,
            background: "#9BFF75",
            color: "#134a16",
            fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',

          }}
        >
          Guardar alumno
        </button>

        {lastCode && (
          <div
            style={{
              marginTop: 10,
              background: "#fff7e6",
              padding: 8,
              borderRadius: 10,
              fontWeight: 700,
            }}
          >
            Código generado: <code>{lastCode}</code>
          </div>
        )}
      </form>

      {/* Tabla de alumnos */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 16px rgba(0,0,0,.08)",
          overflowX: "auto",
        }}
      >
        {loading ? (
          <p>Cargando...</p>
        ) : !filtered.length ? (
          <p>No hay alumnos registrados.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>
                <th>Código</th>
                <th>Nombre</th>
                <th>Sección</th>
                <th>Fecha nac.</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{s.student_code || "—"}</td>
                  <td>{`${s.first_name || ""} ${s.last_name || ""}`}</td>
                  <td>{s.grade || "—"}</td>
                  <td>{fmtDate(s.dob)}</td>
                  <td
                    style={{
                      fontWeight: 800,
                      color: s.status === "active" ? "#1b5e20" : "#c62828",
                    }}
                  >
                    {s.status}
                  </td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => onToggle(s.id, s.status)}
                      style={{
                        ...buttonStyle,
                        background: "#FFF59D",
                        color: "#a15505ff",
                        fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
                      }}
                    >
                      {s.status === "active" ? "Bloquear" : "Activar"}
                    </button>
                    <button
                      onClick={() => setEditing(s)}
                      style={{
                        ...buttonStyle,
                        background: "#a8ec74ff",
                        color: "#37890bff",
                        fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onRemove(s.id)}
                      style={{
                        ...buttonStyle,
                        background: "#f97f7fff",
                        color: "#7d0a0aff",
                        fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de edición */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 16,
              boxShadow: "0 6px 18px rgba(0,0,0,.2)",
              width: 320,
            }}
          >
            <h3 style={{ marginTop: 0 }}>✏️ Editar alumno</h3>

            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <select
              value={editSection}
              onChange={(e) => setEditSection(e.target.value)}
              style={{ ...inputStyle, marginBottom: 10 }}
            >
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select>
            <input
              type="date"
              value={editDob}
              onChange={(e) => setEditDob(e.target.value)}
              style={{ ...inputStyle, marginBottom: 14 }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSaveEdit}
                style={{ ...buttonStyle, background: "#9BFF75", flex: 1 }}
              >
                Guardar
              </button>
              <button
                onClick={() => setEditing(null)}
                style={{ ...buttonStyle, background: "#FFCDD2", flex: 1 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
