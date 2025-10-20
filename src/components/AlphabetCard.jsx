import React from "react";

export default function AlphabetCard({ image, upper, lower, onPlay }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <div
        style={{
          position: "relative",
          width: "min(92vw, 960px)",
          aspectRatio: "16 / 10",
          border: "12px solid #8ad11a",
          borderRadius: 14,
          background: "#eef6fb",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: '"Baloo 2", "Century Gothic", sans-serif',
        }}
      >
        {/* Imagen */}
        <img
          src={image}
          alt={`${upper}${lower}`}
          style={{
            maxWidth: "60%",
            height: "auto",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />

        {/* Letras — con colores y separación */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: "0.6em",
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontSize: "clamp(72px, 9vw, 140px)",
              fontWeight: 800,
              color: "#2D8CFF", // azul para MAYÚSCULA
              lineHeight: 1,
            }}
          >
            {upper}
          </span>
          <span
            style={{
              fontSize: "clamp(60px, 8vw, 120px)",
              fontWeight: 800,
              color: "#FF4F4F", // rojo para minúscula
              lineHeight: 1,
            }}
          >
            {lower}
          </span>
        </div>

        {/* Botón reproducir */}
        <button
          onClick={onPlay}
          title="Escuchar"
          style={{
            position: "absolute",
            left: 24,
            bottom: 24,
            background: "#ffbf47",
            border: "none",
            borderRadius: 16,
            padding: "12px 18px",
            fontSize: 22,
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(0,0,0,.15)",
            transition: "transform 0.1s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          🔊
        </button>
      </div>
    </div>
  );
}
