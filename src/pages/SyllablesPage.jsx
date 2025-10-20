// src/pages/SyllablesPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { findSyllableSet, SYLLABLES } from "../data/syllables.js";
import HomeFab from "../components/HomeFab.jsx";
import { logStudentProgress } from "../services/progress.js";

export default function SyllablesPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const syllableSet = findSyllableSet(id);
  const idx = SYLLABLES.findIndex((s) => s.id === id);

  const [zoom, setZoom] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  // Fondo limpio mientras esta página esté activa
  useEffect(() => {
    document.body.classList.add("clean-canvas");
    return () => document.body.classList.remove("clean-canvas");
  }, []);

  // Reproductor único
  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = new Audio();

  // Manejo de eventos del audio
  useEffect(() => {
    const a = audioRef.current;
    const onEnded = () => setPlayingId(null);
    const onError = () => setPlayingId(null);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);
    return () => {
      // limpia el audio al desmontar o cambiar de set (ver deps abajo)
      a.pause();
      a.src = "";
      a.currentTime = 0;
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
    };
    // importante: dependemos de `id` para limpiar al cambiar de set
  }, [id]);

  // Prev/Next helpers
  const prevId = idx > 0 ? SYLLABLES[idx - 1].id : null;
  const nextId = idx < SYLLABLES.length - 1 ? SYLLABLES[idx + 1].id : null;

  const go = (slug) => {
    if (!slug) return;
    // detener audio antes de navegar
    try {
      const a = audioRef.current;
      a.pause();
      a.src = "";
      a.currentTime = 0;
    } catch {}
    setPlayingId(null);

    nav(`/estudiante/silabas/${slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!syllableSet) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>
          No encontré las sílabas para <b>{id}</b>.
        </p>
        <Link className="btn" to="/estudiante">
          Volver
        </Link>
      </div>
    );
  }

  const play = async (src, syll) => {
    if (!src) return; // sin audio, no hacemos nada
    const a = audioRef.current;

    try {
      // Si ya está reproduciendo la misma tarjeta, no hagas nada
      if (playingId && playingId === syll.id && !a.paused) return;

      // Reinicia cualquier reproducción previa
      if (!a.paused) {
        a.pause();
        a.currentTime = 0;
      }

      a.src = src;
      setPlayingId(syll.id);
      await a.play();

      // Registrar progreso
      try {
        await logStudentProgress({
          kind: "syllable",
          target: syll.text,                  // "ma", "me", ...
          action: "listen",
          meta: { word: syll.word, audio_url: src, set: syllableSet.id },
          score: 1.0,
          accuracy: 1.0,
          wpm: null,
          errors: {},
        });
      } catch (rpcErr) {
        // No romper UI si falla el RPC
        console.warn("No se pudo registrar progreso:", rpcErr?.message || rpcErr);
      }
    } catch (err) {
      console.error("Error al reproducir/registrar:", err?.message || err);
      setPlayingId(null);
    }
  };

  const handleCardClick = (syll) => {
    setZoom(zoom?.id === syll.id ? null : syll);
    if (syll?.audio) play(syll.audio, syll);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "linear-gradient(to bottom, #bde3ff, #eaf7ff)",
        overflowX: "hidden",
        padding: "1rem 0 2rem",
      }}
    >
      <header
        style={{
          width: "min(96vw, 1100px)",
          margin: "0 auto 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <HomeFab fixed={false} />
        {/* No hay logout aquí: el cierre de sesión vive en StudentHome */}
      </header>

      <h2
        style={{
          textAlign: "center",
          margin: "12px 0 18px",
          fontSize: "2.4rem",
          fontWeight: 800,
          color: "#283b6a",
        }}
      >
        Sílabas con{" "}
        <span style={{ fontSize: "3.2rem", color: "#ff3366" }}>
          {syllableSet.title.toUpperCase()}
        </span>{" "}
        <span style={{ fontSize: "3rem", color: "#ff3366" }}>
          {syllableSet.title.toLowerCase()}
        </span>
      </h2>

      <main
        style={{
          width: "min(96vw, 1100px)",
          margin: "0 auto",
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          justifyItems: "center",
        }}
      >
        {syllableSet.sylls.map((syll) => {
          const isZoom = zoom?.id === syll.id;
          const isPlaying = playingId === syll.id;
          return (
            <div
              key={syll.id}
              onClick={() => handleCardClick(syll)}
              role="button"
              title={`Escuchar: ${syll.text}`}
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: isZoom ? 20 : 14,
                width: isZoom ? 220 : 180,
                height: isZoom ? 240 : 200,
                boxShadow: isPlaying
                  ? "0 0 0 4px rgba(255, 51, 102, .25), 0 8px 20px rgba(0,0,0,.12)"
                  : "0 8px 20px rgba(0,0,0,.12)",
                outline: isPlaying ? "2px solid #ff3366" : "none",
                transition: "all .2s ease",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {syll.image && (
                <img
                  src={syll.image}
                  alt={syll.word || "sílabas"}
                  style={{
                    width: isZoom ? 120 : 90,
                    height: "auto",
                    marginBottom: 10,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />
              )}
              <div
                style={{
                  fontSize: isZoom ? 30 : 24,
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                {syll.text}
              </div>
              <div style={{ fontSize: isZoom ? 18 : 16, color: "#425466" }}>
                {syll.word}
              </div>
              {isPlaying && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "#ff3366",
                    fontWeight: 700,
                  }}
                >
                  ▶ Reproduciendo…
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* navegación inferior */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          marginTop: 30,
        }}
      >
        <button
          className="btn"
          onClick={() => go(prevId)}
          disabled={!prevId}
          style={{ opacity: !prevId ? 0.5 : 1,
            fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
            fontWeight:600,
          }}
          
        >
          ⟵ Anterior
        </button>
        <button
          className="btn btn-teacher"
          onClick={() => go(nextId)}
          disabled={!nextId}
          style={{ opacity: !nextId ? 0.5 : 1, 
            fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
            fontWeight:600,
          }}
        >
          Siguiente ⟶
        </button>
      </div>
    </div>
  );
}
