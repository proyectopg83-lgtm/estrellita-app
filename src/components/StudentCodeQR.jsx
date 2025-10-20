// src/components/StudentCodeQR.jsx
import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function StudentCodeQR({ code, onClose }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (!code) return;

    // 🔗 1️⃣ Generar un link que lleve directo al login con el código del estudiante
    const base =
      import.meta.env.PROD
        ? "https://TU-DOMINIO.com" // 🔸 cámbialo al dominio real cuando publiques
        : "http://localhost:5173"; // 🔸 mientras desarrollas

    const loginURL = `${base}/login-estudiante?code=${encodeURIComponent(code)}`;

    // 2️⃣ Generar la imagen QR con ese enlace
    QRCode.toDataURL(loginURL, { margin: 1, scale: 8 }, (err, url) => {
      if (!err) setDataUrl(url);
    });
  }, [code]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(420px, 92vw)",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 16px 40px rgba(0,0,0,.25)",
          padding: 18,
          textAlign: "center",
          fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
        }}
      >
        <h3
          style={{
            margin: 0,
            marginBottom: 10,
            color: "#0d47a1",
            fontWeight: 800,
          }}
        >
          Código del estudiante
        </h3>

        {dataUrl ? (
          <img
            src={dataUrl}
            alt="QR del código del estudiante"
            style={{
              width: "min(320px, 70vw)",
              height: "auto",
              margin: "8px auto 12px",
            }}
          />
        ) : (
          <p style={{ margin: "24px 0" }}>Generando QR…</p>
        )}

        <code
          style={{
            display: "inline-block",
            background: "#f7fafc",
            border: "1px solid #e2e8f0",
            padding: "8px 12px",
            borderRadius: 10,
            marginBottom: 12,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          {code}
        </code>

        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <a
            href={dataUrl || "#"}
            download={`codigo-${code}.png`}
            style={{
              background: "#9BFF75",
              color: "#134a16",
              border: "none",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 6px 12px rgba(0,0,0,.08)",
            }}
          >
            Descargar PNG
          </a>

          <button
            onClick={onClose}
            style={{
              background: "#FFD54F",
              color: "#2a1f00",
              border: "none",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 6px 12px rgba(0,0,0,.08)",
              fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
