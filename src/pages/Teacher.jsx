// src/pages/teacher/Teacher.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth.jsx";
import LogoutButton from "../components/LogoutButton.jsx";
import { useNavigate } from "react-router-dom";

// Services (Supabase)
import { getStudentsByCurrentTeacher } from "../services/students.js";
import { fetchCurricularSummary } from "../services/progressSummary.js";

// Modal del QR
import StudentCodeQR from "../components/StudentCodeQR.jsx";

// ===== helper: elegir nombre mostrado =====
function getDisplayName(user, teacher) {
  const fromTeacher = teacher?.full_name?.trim();
  if (fromTeacher) return fromTeacher;
  const meta = user?.user_metadata || {};
  const fromMeta =
    (meta.full_name || meta.name || meta.fullName || meta.fullname || "").trim();
  if (fromMeta) return fromMeta;
  return user?.email || "Docente";
}

// ===== barra de progreso simple =====
function ProgressBar({ value }) {
  return (
    <div style={{ background: "#edf2f7", borderRadius: 999, height: 10, width: "clamp(110px, 28vw, 160px)" }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(value || 0, 100))}%`,
          height: "100%",
          borderRadius: 999,
          background: "linear-gradient(90deg,#7dd3fc,#22c55e)",
          transition: "width .4s ease",
        }}
      />
    </div>
  );
}

/** Mapea fila de Supabase -> modelo UI */
function mapRowToUI(r) {
  const fn = (r.first_name || "").trim();
  const ln = (r.last_name || "").trim();
  const displayName = [fn, ln].filter(Boolean).join(" ") || "Sin nombre";
  return {
    uid: r.id,
    first_name: r.first_name || "",
    last_name: r.last_name || "",
    displayName,
    section: r.grade || "—",
    dob: r.dob || null,
    status: r.status || "active",
    studentCode: r.student_code || "",
    progress: 0,   // overall curricular (0..100)
    areas: null,   // detalle por área
  };
}

// ===== mini chips por área =====
function AreaChips({ areas }) {
  if (!areas) return null;
  const fmt = (name, a) => {
    const done = a?.completed ?? 0;
    const tot  = a?.total ?? 0;
    const pct  = a?.percent ?? 0;
    return (
      <span
        key={name}
        style={{
          display: "inline-block",
          fontSize: 12,
          background: "#f1f5f9",
          borderRadius: 999,
          padding: "2px 8px",
          marginRight: 6,
          whiteSpace: "nowrap",
        }}
        title={`${name}: ${done}/${tot} (${pct}%)`}
      >
        <b>{name}</b> {done}/{tot} · {pct}%
      </span>
    );
  };
  return (
    <div style={{ marginTop: 4 }}>
      {fmt("Letras", areas.letters)}
      {fmt("Sílabas", areas.syllables)}
      {fmt("Oraciones", areas.sentences)}
      {fmt("Textos", areas.texts)}
    </div>
  );
}

export default function Teacher() {
  const { user, teacher } = useAuth(); // Supabase user + perfil teacher
  const nav = useNavigate();

  const displayName = getDisplayName(user, teacher);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para el modal de QR
  const [qrCode, setQrCode] = useState(null);
  const openQR = (code) => {
    if (!code) {
      alert("Este estudiante aún no tiene código generado.");
      return;
    }
    setQrCode(code);
  };
  const closeQR = () => setQrCode(null);

  const refresh = async () => {
    setLoading(true);
    try {
      // 1) alumnos del docente
      const rows = await getStudentsByCurrentTeacher();
      const base = rows.map(mapRowToUI);
      setStudents(base);

      // 2) resumen curricular (views SQL)
      const ids = base.map((s) => s.uid);
      const summaryMap = await fetchCurricularSummary(ids);

      // 3) fusiona el % overall y guarda detalle por área
      setStudents((prev) =>
        prev.map((s) => {
          const sm = summaryMap.get(s.uid);
          if (!sm) return s;
          return {
            ...s,
            progress: sm.overallPct,
            areas: sm, // por si luego quieres tooltip con letras/sílabas/etc
          };
        })
      );
    } catch (e) {
      console.error(e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const counts = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.status === "active").length;
    return { total, active, blocked: total - active };
  }, [students]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "20px",
        fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
        display: "flex",
        justifyContent: "center",
        background: "linear-gradient(to bottom, #bde3ff, #eaf7ff)",
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .t-header h2 { font-size: 1.1rem; }
          .t-header p { font-size: .85rem; }
          .t-cell { padding: 8px !important; }
          .t-actions { gap: 6px !important; }
          .t-actions > * { padding: 6px 8px !important; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 1100 }}>
        {/* Header */}
        <header
          className="t-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#ffffffaa",
            padding: "12px 20px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0, color: "#0d47a1", fontWeight: 800 }}>👩‍🏫 Panel del Docente</h1>
            <p style={{ margin: 0, color: "#444", fontSize: 20 }}>
              Bienvenido/a, <b>{displayName}</b>
            </p>
          </div>
          <LogoutButton />
        </header>

        {/* Accesos rápidos */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => nav("/docente/roster")}
            style={{
              border: "none",
              background: "#e8f0fe",
              color: "#0d47a1",
              padding: "16px",
              borderRadius: 14,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,.08)",
              textAlign: "left",
              fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
            }}
          >
            👥 Ver alumnos
            <div style={{ marginTop: 6, fontSize: 13, color: "#234" }}>
              Total: <b>{counts.total}</b> · Activos: <b>{counts.active}</b>
            </div>
          </button>

          <button
            onClick={() => nav("/docente/perfil")}
            style={{
              border: "none",
              background: "#f0ffee",
              color: "#14532d",
              padding: "16px",
              borderRadius: 14,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,.08)",
              textAlign: "left",
              fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
            }}
          >
            👤 Mi perfil
            <div style={{ marginTop: 6, fontSize: 13, color: "#234" }}>
              {user?.email}
            </div>
          </button>
        </section>

        {/* Tabla rápida */}
        <section
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 12,
            boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
          }}
        >
          {loading ? (
            <p style={{ margin: 0, color: "#555" }}>Cargando…</p>
          ) : !students.length ? (
            <p style={{ margin: 0, color: "#555" }}>Aún no hay estudiantes registrados.</p>
          ) : (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: 720,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                    <th className="t-cell" style={{ padding: 8 }}>Nombre</th>
                    <th className="t-cell" style={{ padding: 8 }}>Código</th>
                    <th className="t-cell" style={{ padding: 8 }}>Sección</th>
                    <th className="t-cell" style={{ padding: 8 }}>Progreso</th>
                    <th className="t-cell" style={{ padding: 8 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 8).map((s, idx) => (
                    <tr
                      key={s.uid}
                      style={{
                        borderBottom: "1px solid #f4f4f4",
                        background: idx % 2 ? "#fcfdff" : "#fff",
                      }}
                    >
                      <td className="t-cell" style={{ padding: 8 }}>{s.displayName}</td>
                      <td className="t-cell" style={{ padding: 8, fontFamily: "monospace" }}>
                        {s.studentCode || "—"}
                      </td>
                      <td className="t-cell" style={{ padding: 8 }}>{s.section}</td>
                      <td className="t-cell" style={{ padding: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ProgressBar value={s.progress} />
                          <b>{s.progress || 0}%</b>
                        </div>
                        {s.areas && <AreaChips areas={s.areas} />}
                      </td>
                      <td className="t-cell" style={{ padding: 8 }}>
                        <div className="t-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            onClick={() =>
                              nav(`/docente/alumno/${s.uid}`, {
                                state: {
                                  student: {
                                    uid: s.uid,
                                    first_name: s.first_name,
                                    last_name: s.last_name,
                                    displayName: s.displayName,
                                    status: s.status,
                                  },
                                },
                              })
                            }
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              background: "#b0dcffff",
                              cursor: "pointer",
                              border: "none",
                              fontWeight: 600,
                              fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
                            }}
                          >
                            Informe
                          </button>
                          <button
                            onClick={() => openQR(s.studentCode)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              background: "#c1f371ff",
                              color: "#1fb708ff",
                              fontWeight: 600,
                              border: "none",
                              cursor: "pointer",
                              fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
                            }}
                          >
                            QR
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Modal QR */}
      {qrCode && <StudentCodeQR code={qrCode} onClose={closeQR} />}
    </main>
  );
}
