// src/pages/teacher/StudentReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchRecentProgress, subscribeProgress } from "../../services/progressFeed";
import { getStudentById } from "../../services/students";

// ─── Charts (Recharts) ───
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Traducciones visibles (no afectan BD) ───
const KIND_LABEL = {
  letter: "Letra",
  syllable: "Sílaba",
  sentence: "Oración",
  text: "Texto",
  word: "Palabra",
  reading: "Lectura",
};
const ACTION_LABEL = {
  listen: "Escuchar",
  record: "Grabar",
  assess: "Evaluar",
};
const tKind = (k) => KIND_LABEL[k] || k || "—";
const tAction = (a) => ACTION_LABEL[a] || a || "—";

// ─── UI helpers ───
const chip = (text, color = "#16a34a") => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
      color: "#0b1f2a",
      background: color,
      opacity: 0.9,
    }}
  >
    {text}
  </span>
);

const kindIcon = {
  letter: "🔤",
  syllable: "🔊",
  word: "🔠",
  reading: "📖",
  sentence: "✏️",
  text: "📚",
};

const actionIcon = {
  listen: "🎧",
  record: "🎙️",
  assess: "✅",
};

function fmtDate(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
}
function yyyy_mm_dd(ts) {
  try {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const da = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${da}`;
  } catch {
    return ts;
  }
}
function FullName({ s }) {
  const fn = (s?.first_name || "").trim();
  const ln = (s?.last_name || "").trim();
  return <>{[fn, ln].filter(Boolean).join(" ") || s?.displayName || "Sin nombre"}</>;
}

/*                  Tabla de progreso               */
function RecentTable({ rows }) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // En impresión mostramos TODO
  const isPrinting =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("print").matches;

  const totalPages = Math.max(1, Math.ceil((rows?.length || 0) / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = isPrinting ? rows : (rows || []).slice(start, start + pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  return (
    <section
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 8px 18px rgba(0,0,0,.08)",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 8, fontSize: "1.25rem", color: "#102a43" }}>
        📋 Eventos recientes
      </h3>

      {!rows?.length ? (
        <p style={{ margin: 0, color: "#475569" }}>Aún no hay registros para este alumno.</p>
      ) : (
        <>
          <div style={{ width: "100%", overflowX: "auto", marginTop: 6 }}>
            <table
              style={{
                width: "100%",
                minWidth: 680,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #eef2f7" }}>
                  <th style={{ padding: 8 }}>Fecha</th>
                  <th style={{ padding: 8 }}>Tipo</th>
                  <th style={{ padding: 8 }}>Objetivo</th>
                  <th style={{ padding: 8 }}>Acción</th>
                  <th style={{ padding: 8 }}>Puntaje</th>
                  <th style={{ padding: 8 }}>Precisión</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f5f7fb" }}>
                    <td style={{ padding: 8, whiteSpace: "nowrap", color: "#334155" }}>
                      {fmtDate(r.recorded_at)}
                    </td>
                    <td style={{ padding: 8 }}>
                      <span style={{ fontSize: 18, marginRight: 6 }}>
                        {kindIcon[r.kind] || "📝"}
                      </span>
                      <b style={{ color: "#0f172a" }}>{tKind(r.kind)}</b>
                    </td>
                    <td style={{ padding: 8, fontFamily: "monospace", color: "#0f172a" }}>
                      {r.target}
                    </td>
                    <td style={{ padding: 8, color: "#0f172a" }}>
                      <span style={{ fontSize: 16, marginRight: 6 }}>
                        {actionIcon[r.action] || "•"}
                      </span>
                      {tAction(r.action)}
                    </td>
                    <td style={{ padding: 8 }}>{r.score ?? "—"}</td>
                    <td style={{ padding: 8 }}>
                      {r.accuracy != null ? `${Math.round(Number(r.accuracy) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controles de paginación: ocultos al imprimir */}
          <div
            className="no-print"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {rows.length} registros · {totalPages} páginas
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  padding: "6px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                ← Anterior
              </button>
              <span style={{ padding: "6px 8px", fontWeight: 700 }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  padding: "6px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/*      Informe individual con dashboard + “IA” simple     */
export default function StudentReport() {
  const { uid } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const studentFromNav = loc.state?.student || null;

  // Alumno
  const [student, setStudent] = useState(studentFromNav);
  const [loadingStudent, setLoadingStudent] = useState(!studentFromNav);

  // Progreso (crudo)
  const [rowsRaw, setRowsRaw] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);

  // Errores
  const [errorMsg, setErrorMsg] = useState("");

  // Filtros UI
  const [days, setDays] = useState(90); // 7 | 30 | 90 | 180 | 0(todo)
  const [kindFilter, setKindFilter] = useState("all"); // all | letter | syllable | sentence | text | ...

  // Carga alumno si entran por URL directa
  useEffect(() => {
    let alive = true;
    if (studentFromNav) {
      setLoadingStudent(false);
    } else {
      (async () => {
        try {
          setErrorMsg("");
          setLoadingStudent(true);
          const s = await getStudentById(uid);
          if (!alive) return;
          if (s) {
            setStudent({
              uid: s.id,
              first_name: s.first_name || "",
              last_name: s.last_name || "",
              displayName:
                [s.first_name, s.last_name].filter(Boolean).join(" ") ||
                s.student_code ||
                "Sin nombre",
              status: s.status || "active",
            });
          } else {
            setStudent({
              uid,
              first_name: "",
              last_name: "",
              displayName: "Sin nombre",
              status: "active",
            });
          }
        } catch (e) {
          console.error(e);
          setErrorMsg("No se pudo cargar los datos del alumno. Reintenta.");
        } finally {
          if (alive) setLoadingStudent(false);
        }
      })();
    }
    return () => {
      alive = false;
    };
  }, [uid, studentFromNav]);

  // Carga progreso (trae bastantes y filtramos aquí) + realtime
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErrorMsg("");
        setLoadingRows(true);
        const data = await fetchRecentProgress(uid, 500); // traemos muchos para graficar
        if (!alive) return;
        setRowsRaw(data || []);
      } catch (e) {
        console.error(e);
        setErrorMsg("No se pudo cargar el progreso reciente. Reintenta.");
      } finally {
        if (alive) setLoadingRows(false);
      }
    })();

    const unsubscribe = subscribeProgress(uid, (newRow) => {
      setRowsRaw((prev) => {
        const next = [newRow, ...prev];
        const seen = new Set();
        return next
          .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
          .slice(0, 600);
      });
    });

    return () => {
      try {
        unsubscribe?.();
      } catch {}
      alive = false;
    };
  }, [uid]);

  // Filtrado por rango y tipo
  const filteredRows = useMemo(() => {
    const now = Date.now();
    let minTs = 0;
    if (days > 0) {
      minTs = now - days * 24 * 60 * 60 * 1000;
    }
    return (rowsRaw || []).filter((r) => {
      const t = new Date(r.recorded_at).getTime();
      if (days > 0 && t < minTs) return false;
      if (kindFilter !== "all" && (r.kind || "other") !== kindFilter) return false;
      return true;
    });
  }, [rowsRaw, days, kindFilter]);

  const headerRight = useMemo(() => {
    const status = (student?.status || "active").toLowerCase();
    const col = status === "active" ? "#bbf7d0" : "#fecaca";
    return chip(status, col);
  }, [student]);

  // ── Series para charts ──
  const accuracySeries = useMemo(() => {
    if (!filteredRows.length) return [];
    const byDay = new Map();
    filteredRows.forEach((r) => {
      if (r.accuracy == null) return;
      const day = yyyy_mm_dd(r.recorded_at);
      const list = byDay.get(day) || [];
      list.push(Number(r.accuracy));
      byDay.set(day, list);
    });
    const series = Array.from(byDay.entries())
      .map(([day, list]) => ({
        day,
        accuracy: Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 100),
      }))
      .sort((a, b) => (a.day < b.day ? -1 : 1));
    return series;
  }, [filteredRows]);

  const kindBars = useMemo(() => {
    if (!filteredRows.length) return [];
    const cnt = new Map();
    filteredRows.forEach((r) => {
      const k = r.kind || "other";
      cnt.set(k, (cnt.get(k) || 0) + 1);
    });
    // traducimos para mostrar, pero mantenemos name para la clave de la barra
    return Array.from(cnt.entries()).map(([kind, count]) => ({
      kind,
      name: tKind(kind),
      count,
    }));
  }, [filteredRows]);

  // KPIs
  const lastAcc = accuracySeries.length ? accuracySeries[accuracySeries.length - 1].accuracy : null;
  const firstAcc = accuracySeries.length ? accuracySeries[0].accuracy : null;
  const trend = lastAcc != null && firstAcc != null ? lastAcc - firstAcc : null;

  const avgAcc = useMemo(() => {
    const withAcc = filteredRows.filter((r) => r.accuracy != null);
    if (!withAcc.length) return null;
    return Math.round(
      (withAcc.reduce((a, r) => a + Number(r.accuracy || 0), 0) / withAcc.length) * 100
    );
  }, [filteredRows]);

  // “Insights” estilo IA (reglas simples)
  const insights = useMemo(() => {
    const tips = [];
    if (avgAcc != null) {
      if (avgAcc >= 85) tips.push("Excelente precisión global. ¡Gran trabajo!");
      else if (avgAcc >= 70) tips.push("Buena base. Afinar pronunciación en casos puntuales.");
      else tips.push("Precisión baja: practica frases cortas y repetición guiada.");
    }
    if (trend != null) {
      if (trend > 0) tips.push(`Tendencia positiva (+${trend} pts) en el periodo.`);
      else if (trend < 0) tips.push(`Ligera caída (${trend} pts). Sugerencia: sesiones breves y frecuentes.`);
      else tips.push("Precisión estable en el periodo observado.");
    }
    const byKind = new Map();
    filteredRows.forEach((r) => {
      const k = r.kind || "other";
      byKind.set(k, [...(byKind.get(k) || []), r]);
    });
    const kindAccs = [];
    for (const [k, list] of byKind.entries()) {
      const usable = list.filter((x) => x.accuracy != null);
      if (!usable.length) continue;
      const acc = usable.reduce((a, x) => a + Number(x.accuracy || 0), 0) / usable.length;
      kindAccs.push({ kind: k, acc: Math.round(acc * 100) });
    }
    kindAccs.sort((a, b) => a.acc - b.acc);
    if (kindAccs.length >= 2) {
      const worst = kindAccs[0];
      const best = kindAccs[kindAccs.length - 1];
      tips.push(`Fortaleza: ${tKind(best.kind)} (~${best.acc}%). Refuerzo: ${tKind(worst.kind)} (~${worst.acc}%).`);
    }
    const total = filteredRows.length;
    if (total >= 20) tips.push("Buen volumen de práctica. Mantener la constancia.");
    else if (total > 0) tips.push("Subir sesiones semanales para consolidar el avance.");
    return tips;
  }, [filteredRows, avgAcc, trend]);

  // “Objetivos a reforzar”: peores 5 (con accuracy) por objetivo (target)
  const weakestTargets = useMemo(() => {
    const byTarget = new Map();
    filteredRows.forEach((r) => {
      if (r.accuracy == null) return;
      const key = `${r.kind}:${r.target}`;
      const list = byTarget.get(key) || [];
      list.push(Number(r.accuracy));
      byTarget.set(key, list);
    });
    const arr = Array.from(byTarget.entries())
      .map(([key, list]) => {
        const avg = list.reduce((a, b) => a + b, 0) / list.length;
        const [kind, ...rest] = key.split(":");
        return {
          key,
          kind,
          target: rest.join(":") || "",
          accuracy: Math.round(avg * 100),
          samples: list.length,
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);
    return arr;
  }, [filteredRows]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 16,
        display: "flex",
        justifyContent: "center",
        fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
        background: "linear-gradient(to bottom, #bde3ff, #eaf7ff)",
      }}
    >
      {/* Estilos y cabeceras SOLO impresión */}
      <style>
        {`
          /* Solo en impresión */
          @media print {
            @page { margin: 18mm 14mm 18mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }

            header.print-header, footer.print-footer {
              position: fixed;
              left: 0; right: 0;
              color: #0f172a;
              font-family: "Century Gothic", CenturyGothic, AppleGothic, sans-serif;
              background: #fff;
            }
            header.print-header { top: 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            footer.print-footer { bottom: 0; padding: 8px 0; border-top: 1px solid #e2e8f0; }

            /* Compensar header/footer en el flujo del contenido */
            main { padding-top: 60px !important; padding-bottom: 50px !important; }

            table { page-break-inside: auto; }
            tr, td, th { page-break-inside: avoid; break-inside: avoid; }
            section { break-inside: avoid-page; page-break-inside: avoid; }
          }
          .print-only { display: none; }
        `}
      </style>

      <header className="print-only print-header">
        <div style={{display:"flex", justifyContent:"space-between", fontSize:12, padding:"0 6mm"}}>
          <span>
            Informe del alumno:{" "}
            <b>
              {student?.first_name} {student?.last_name || ""}
            </b>
          </span>
          <span>{new Date().toLocaleString()}</span>
        </div>
      </header>

      <footer className="print-only print-footer">
        <div style={{display:"flex", justifyContent:"space-between", fontSize:12, padding:"0 6mm"}}>
          <span>Docente — Sistema de Lectoescritura</span>
          <span className="page-number"></span>
        </div>
      </footer>

      <div style={{ width: "100%", maxWidth: 1100 }}>
        {/* Header (pantalla) */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#ffffffaa",
            padding: "14px 20px",
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            marginBottom: 14,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#0d47a1", fontWeight: 800 }}>📒 Informe del alumno</h2>
            <p style={{ margin: 0, color: "#334155" }}>
              {loadingStudent ? (
                <>Cargando…</>
              ) : (
                <>
                  <b><FullName s={student} /></b> &nbsp; {chip(student?.displayName ? "identificado" : "sin-nombre", "#e2e8f0")} &nbsp; {headerRight}
                </>
              )}
            </p>
          </div>

          {/* Botones (no se imprimen) */}
          <div className="no-print" style={{display:"flex", gap:8}}>
            <button
              onClick={() => nav("/docente")}
              style={{
                background: "#cbfc7bff",
                border: "none",
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 800,
                cursor: "pointer",
                color: "#204e07ff",
                boxShadow: "0 4px 10px rgba(0,0,0,.08)",
                fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
              }}
            >
              ← Volver al panel
            </button>

            <button
              onClick={() => window.print()}
              style={{
                background: "#e62e90ff",
                border: "none",
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 800,
                cursor: "pointer",
                color: "#fde3f4ff",
                boxShadow: "0 4px 10px rgba(0,0,0,.08)",
                fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
              }}
              aria-label="Imprimir informe del alumno"
            >
              🖨️ Imprimir
            </button>
          </div>
        </header>

        {/* Banner de error */}
        {errorMsg && (
          <div
            role="alert"
            className="no-print"
            style={{
              background:"#fef2f2", color:"#7f1d1d", border:"1px solid #fecaca",
              padding:12, borderRadius:12, marginBottom:12, display:"flex",
              justifyContent:"space-between", alignItems:"center", gap:8
            }}
          >
            <span>⚠️ {errorMsg}</span>
            <div style={{display:"flex", gap:8}}>
              <button
                onClick={() => window.location.reload()}
                style={{border:"none", background:"#fee2e2", padding:"6px 10px", borderRadius:8, fontWeight:700, cursor:"pointer"}}
              >
                Reintentar
              </button>
              <button
                onClick={() => setErrorMsg("")}
                style={{border:"none", background:"transparent", padding:"6px 8px", borderRadius:8, cursor:"pointer"}}
                aria-label="Cerrar alerta"
              >
                ✖
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <section
          className="no-print"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 10,
              boxShadow: "0 6px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Rango de fechas</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "7 días", value: 7 },
                { label: "30 días", value: 30 },
                { label: "90 días", value: 90 },
                { label: "180 días", value: 180 },
                { label: "Todo", value: 0 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  style={{
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontWeight: 800,
                    cursor: "pointer",
                    background: days === opt.value ? "#a3d2ff" : "#eef2ff",
                    color: days === opt.value ? "#082a4b" : "#1e293b",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 10,
              boxShadow: "0 6px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Tipo</div>
            <div>
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontWeight: 700,
                  color: "#0f172a",
                  background: "#f8fafc",
                }}
              >
                <option value="all">Todos</option>
                <option value="letter">Letras</option>
                <option value="syllable">Sílabas</option>
                <option value="sentence">Oraciones</option>
                <option value="text">Textos</option>
              </select>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 14,
              boxShadow: "0 8px 18px rgba(0,0,0,.08)",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b" }}>Precisión reciente</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>
              {loadingRows ? "—" : lastAcc != null ? `${lastAcc}%` : "—"}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {trend == null ? "Sin tendencia" : trend >= 0 ? `▲ +${trend} pts` : `▼ ${trend} pts`}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 14,
              boxShadow: "0 8px 18px rgba(0,0,0,.08)",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b" }}>Precisión promedio (filtro)</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>
              {loadingRows ? "—" : avgAcc != null ? `${avgAcc}%` : "—"}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {filteredRows.length} eventos en el rango seleccionado
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 14,
              boxShadow: "0 8px 18px rgba(0,0,0,.08)",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b" }}>Cobertura por tipo</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {kindBars.map((k) => (
                <span
                  key={k.kind}
                  style={{
                    fontSize: 12,
                    background: "#f1f5f9",
                    borderRadius: 999,
                    padding: "2px 8px",
                    color: "#0b1f2a",
                  }}
                  title={k.kind}
                >
                  {k.name}: <b>{k.count}</b>
                </span>
              ))}
              {!kindBars.length && <span style={{ fontSize: 12, color: "#64748b" }}>—</span>}
            </div>
          </div>
        </section>

        {/* Charts */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 12,
              boxShadow: "0 8px 18px rgba(0,0,0,.08)",
              minHeight: 280,
            }}
          >
            <h3 style={{ margin: "4px 0 8px", color: "#102a43" }}>📉 Precisión promedio por día</h3>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={accuracySeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" name="Precisión (%)" stroke="#2563eb" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 12,
              boxShadow: "0 8px 18px rgba(0,0,0,.08)",
              minHeight: 280,
            }}
          >
            <h3 style={{ margin: "4px 0 8px", color: "#102a43" }}>📊 Actividad por tipo</h3>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={kindBars}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Eventos" fill="#a8de15ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Objetivos a reforzar */}
        <section
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 8px 18px rgba(0,0,0,.08)",
            marginBottom: 14,
          }}
        >
          <h3 style={{ marginTop: 0, color: "#102a43" }}>🎯 Objetivos a reforzar</h3>
          {!weakestTargets.length ? (
            <p style={{ margin: 0, color: "#475569" }}>Sin suficientes datos para sugerencias.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, color: "#334155" }}>
              {weakestTargets.map((t) => (
                <li key={t.key} style={{ marginBottom: 6 }}>
                  <b>{tKind(t.kind)}</b> · <span style={{ fontFamily: "monospace" }}>{t.target}</span>{" "}
                  — precisión ~{t.accuracy}% (muestras: {t.samples})
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* “Insights” estilo IA */}
        <section
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 8px 18px rgba(0,0,0,.08)",
            marginBottom: 14,
          }}
        >
          <h3 style={{ marginTop: 0, color: "#102a43" }}>🤖 Resumen </h3>
          {loadingRows ? (
            <p style={{ margin: 0, color: "#475569" }}>Analizando…</p>
          ) : !filteredRows.length ? (
            <p style={{ margin: 0, color: "#475569" }}>
              Sin datos en el rango/filtrado seleccionado.
            </p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, color: "#334155" }}>
              {insights.map((t, i) => (
                <li key={i} style={{ marginBottom: 6 }}>{t}</li>
              ))}
            </ul>
          )}
        </section>

        {/* Tabla de eventos */}
        {loadingRows ? (
          <section
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 8px 18px rgba(0,0,0,.08)",
            }}
          >
            <p style={{ margin: 0, color: "#475569" }}>Cargando registros…</p>
          </section>
        ) : (
          <RecentTable rows={filteredRows} />
        )}
      </div>
    </main>
  );
}
