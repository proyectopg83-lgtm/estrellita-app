// src/components/SyllableButton.jsx
import React from "react";

export default function SyllableButton({ text, audio }) {
  const play = async () => {
    // 1) Intentar reproducir archivo MP3 (si existe y carga)
    if (audio) {
      try {
        const a = new Audio(audio);
        await a.play();
        return;
      } catch {
        // si falla, caemos a TTS
      }
    }
    // 2) Fallback: Text-to-Speech del navegador
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-ES";  // latino neutro (puedes probar 'es-MX' también)
      u.rate = 0.9;      // un poquito más lento
      window.speechSynthesis.speak(u);
    } else {
      alert(`Sílaba: ${text}`);
    }
  };

  return (
    <button
      onClick={play}
      aria-label={`Reproducir sílaba ${text}`}
      style={{
        width: 110,
        height: 110,
        borderRadius: 18,
        border: "0",
        background: "#fff",
        boxShadow: "0 10px 24px rgba(0,0,0,.12)",
        display: "grid",
        placeItems: "center",
        fontSize: 42,
        fontWeight: 800,
        color: "#1F3140",
        cursor: "pointer",
        transition: "transform .08s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {text}
    </button>
  );
}
