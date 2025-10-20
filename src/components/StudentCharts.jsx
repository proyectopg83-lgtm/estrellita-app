// src/components/StudentCharts.jsx
import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  Tooltip, Legend
} from "chart.js";
import { fetchStudentKpis, fetchStudentDailyAccuracy } from "../services/analytics";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

export default function StudentCharts({ studentId }) {
  const [kpis, setKpis] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [a, b] = await Promise.all([
          fetchStudentKpis(studentId),
          fetchStudentDailyAccuracy(studentId),
        ]);
        if (!alive) return;
        setKpis(a || []);
        setDaily(b || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [studentId]);

  // --- Datos de barras: precisión por tipo ---
  const kindsOrder = ["letter", "syllable", "sentence", "text"];
  const labelByKind = { letter: "Letras", syllable: "Sílabas", sentence: "Oraciones", text: "Textos" };

  const labelsBar = kindsOrder.map(k => labelByKind[k]);
  const accByKind = kindsOrder.map(k => {
    const row = kpis.find(r => r.kind === k);
    return row?.avg_accuracy != null ? Math.round(Number(row.avg_accuracy) * 100) : 0;
  });

  const barData = {
    labels: labelsBar,
    datasets: [
      {
        label: "Precisión (%)",
        data: accByKind,
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}%` } },
    },
    scales: {
      y: { suggestedMin: 0, suggestedMax: 100, ticks: { callback: (v) => `${v}%` } },
    },
  };

  // --- Datos de línea: evolución diaria ---
  const lineData = {
    labels: daily.map(d => new Date(d.day).toLocaleDateString()),
    datasets: [
      {
        label: "Precisión diaria (%)",
        data: daily.map(d => Math.round(Number(d.avg_accuracy || 0) * 100)),
        tension: 0.3,
        pointRadius: 3,
        borderWidth: 2,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}%` } },
    },
    scales: {
      y: { suggestedMin: 0, suggestedMax: 100, ticks: { callback: (v) => `${v}%` } },
    },
  };

  return (
    <section style={{ display: "grid", gap: 16, marginTop: 16 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 4px 12px rgba(0,0,0,.06)" }}>
        <h3 style={{ margin: "0 0 8px", color: "#102a43" }}>📊 Precisión por tipo</h3>
        {loading ? <p style={{ margin: 0, color: "#475569" }}>Cargando…</p> : <Bar data={barData} options={barOptions} />}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 4px 12px rgba(0,0,0,.06)" }}>
        <h3 style={{ margin: "0 0 8px", color: "#102a43" }}>📈 Evolución diaria</h3>
        {loading ? <p style={{ margin: 0, color: "#475569" }}>Cargando…</p> : <Line data={lineData} options={lineOptions} />}
      </div>
    </section>
  );
}
