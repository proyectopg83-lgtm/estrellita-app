// src/pages/teacher/StudentCodeCard.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";

const STUDENTS_KEY = "estrellita_students";

function getStudentByUid(uid) {
  try {
    const map = JSON.parse(localStorage.getItem(STUDENTS_KEY) || "{}");
    return map?.[uid] || null;
  } catch {
    return null;
  }
}

export default function StudentCodeCard() {
  const { uid } = useParams();
  const [student, setStudent] = useState(null);
  const [qrOk, setQrOk] = useState(false);

  const cardRef = useRef(null);
  const canvasRef = useRef(null);

  // tamaño visible del QR (se recalcula según ancho de la tarjeta)
  const [qrCssSize, setQrCssSize] = useState(140); // px

  useEffect(() => {
    setStudent(uid ? getStudentByUid(uid) : null);
  }, [uid]);

  // Recalcular tamaño del QR al cambiar ancho / resize
  useEffect(() => {
    const update = () => {
      const w = cardRef.current?.offsetWidth || 880;
      // 26% del ancho, con límites más amplios para móviles
      const size = Math.max(96, Math.min(200, Math.round(w * 0.26)));
      setQrCssSize(size);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Generar QR en alta resolución interna
  useEffect(() => {
    (async () => {
      if (!student) return;
      const code = student.code || student.uid || "";
      try {
        const QRCode = (await import("qrcode")).default;
        await QRCode.toCanvas(canvasRef.current, code, {
          margin: 0,
          width: 512,
          errorCorrectionLevel: "M",
        });
        setQrOk(true);
      } catch (err) {
        console.warn("Instala `npm i qrcode` para ver el QR localmente.", err);
        setQrOk(false);
      }
    })();
  }, [student]);

  if (!student) {
    return (
      <main style={{ minHeight: "100vh", padding: 16 }}>
        <p>No se encontró el alumno solicitado.</p>
        <Link to="/docente" className="btn">⬅ Volver</Link>
      </main>
    );
  }

  const code = student.code || student.uid;
  const name = student.name || "Alumno/a";
  const section = student.classId || "—";

  const downloadPng = () => {
    const card = document.getElementById("print-card");
    const scale = 2;
    const rect = card.getBoundingClientRect();

    const c = document.createElement("canvas");
    c.width = rect.width * scale;
    c.height = rect.height * scale;
    const ctx = c.getContext("2d");
    ctx.scale(scale, scale);

    // Fondo
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Marca
    ctx.font = "bold 48px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillStyle = "#1d3557";
    ctx.fillText("🌟 Estrellita", 24, 64);

    // Nombre (fluido pero fijo en PNG)
    ctx.font = "700 32px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillStyle = "#0b3b58";
    ctx.fillText(name, 24, 116);

    // Sección
    ctx.font = "600 20px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillStyle = "#425466";
    ctx.fillText(`Sección: ${section}`, 24, 146);

    // Código
    ctx.font = "800 36px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "#1f2937";
    ctx.fillText(code, 24, 196);

    // QR
    const qrDraw = Math.min(180, Math.round(rect.width * 0.22));
    if (qrOk && canvasRef.current) {
      ctx.drawImage(canvasRef.current, rect.width - 24 - qrDraw, 24, qrDraw, qrDraw);
    }

    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `tarjeta-${code}.png`;
    a.click();
  };

  const printCard = () => window.print();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #cce9ff, #f9fff5)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Estilos de impresión + responsivo */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #print-card {
            box-shadow: none !important;
            border: 1px solid #ddd;
          }
        }
        /* apila a 1 columna antes y centra QR */
        @media (max-width: 900px) {
          #print-card {
            grid-template-columns: 1fr !important;
            row-gap: 16px;
            padding: 18px;
          }
          #print-card .qr-col {
            justify-self: center !important;
          }
        }
        /* ajustes extra pequeños */
        @media (max-width: 480px) {
          #print-card .title {
            font-size: 30px !important;
          }
          #print-card .name {
            font-size: 22px !important;
          }
          #print-card .code-badge span.code {
            font-size: 22px !important;
          }
        }
      `}</style>

      {/* Barra acciones */}
      <div
        className="no-print"
        style={{
          width: "min(96vw, 880px)",
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Link to="/docente" style={{ textDecoration: "none" }}>
          <button
            className="btn"
            style={{
              background: "#FFD54F",
              color: "#2a1f00",
              borderRadius: 12,
              fontWeight: 800,
              fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
            }}
          >
            ⬅️ Volver
          </button>
        </Link>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={downloadPng}
            className="btn"
            style={{
              fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
              background: "#e6f0ff",
              color: "#0b3b58",
              borderRadius: 12,
              fontWeight: 800,
            }}
          >
            ⬇️ Descargar PNG
          </button>
          <button
            onClick={printCard}
            className="btn"
            style={{
              fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
              background: "#9BFF75",
              color: "#183b1a",
              borderRadius: 12,
              fontWeight: 800,
            }}
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {/* Tarjeta responsiva */}
      {/* Tarjeta responsiva */}
<section
  id="print-card"
  ref={cardRef}
  style={{
    width: "min(96vw, 880px)",
    background: "#fff",
    borderRadius: 18,
    boxShadow: "0 10px 24px rgba(0,0,0,.10)",
    padding: 24,
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 12,
    alignItems: "center",
  }}
>
  <style>{`
    /* fuerza diseño responsivo fluido */
    @media (max-width: 900px) {
      #print-card {
        grid-template-columns: 1fr !important;
        text-align: center;
        padding: 20px !important;
      }
      #print-card > div {
        justify-self: center !important;
      }
      #print-card canvas {
        margin-top: 16px;
        width: clamp(120px, 60vw, 220px) !important;
        height: auto !important;
      }
    }
  `}</style>

  <div style={{ width: "100%" }}>
    <div style={{ fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 900, color: "#1d3557", marginBottom: 6 }}>
      🌟 Estrellita
    </div>
    <div style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "#0b3b58" }}>
      {name}
    </div>
    <div style={{ fontSize: "clamp(14px, 2vw, 16px)", fontWeight: 700, color: "#425466", marginTop: 4 }}>
      Sección: <b>{section}</b>
    </div>

    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 12,
        background: "#f0f7ff",
        marginTop: 16,
        border: "2px dashed #b7e3ff",
        maxWidth: "100%",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      <span style={{ fontSize: "clamp(14px, 2.6vw, 18px)", color: "#0b3b58", fontWeight: 800 }}>Código:</span>
      <span
        style={{
          fontSize: "clamp(18px, 4vw, 28px)",
          fontWeight: 900,
          letterSpacing: 1,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          wordBreak: "break-all",
        }}
      >
        {code}
      </span>
    </div>

    {!qrOk && (
      <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
        (Instala <b>npm i qrcode</b> para mostrar el QR localmente)
      </div>
    )}
  </div>

  <div style={{ justifySelf: "end", textAlign: "center" }}>
    <canvas
      ref={canvasRef}
      width={512}
      height={512}
      style={{
        width: qrCssSize,
        height: qrCssSize,
        borderRadius: 16,
        background: qrOk ? "#fff" : "#f6f6f6",
        boxShadow: qrOk ? "0 6px 14px rgba(0,0,0,.08)" : "none",
        maxWidth: "100%",
      }}
    />
    <div style={{ fontSize: 12, marginTop: 6, color: "#425466" }}>
      Escanéame para ingresar
    </div>
  </div>
</section>

    </main>
  );
}
