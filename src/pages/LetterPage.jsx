// src/pages/LetterPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AlphabetCard from "../components/AlphabetCard.jsx";
import { ALPHABET, indexById } from "../data/alphabet.js";
import HomeFab from "../components/HomeFab.jsx";
import { logStudentProgress } from "../services/progress.js";
import { logoutStudent } from "../services/studentAuth.js"; // cierra local + Supabase

export default function LetterPage() {
  const { id } = useParams();
  const nav = useNavigate();

  // localizar letra y prev/next
  const { letter, prevId, nextId } = useMemo(() => {
    const i = indexById(id);
    const safeIndex = i >= 0 ? i : 0;
    const letter = ALPHABET[safeIndex];
    const isFirst = safeIndex === 0;
    const isLast  = safeIndex === ALPHABET.length - 1;
    const prevId = !isFirst ? ALPHABET[safeIndex - 1].id : null;
    const nextId = !isLast  ? ALPHABET[safeIndex + 1].id : null;
    return { letter, prevId, nextId };
  }, [id]);

  // audio
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // para evitar doble play/registro si ya está sonando esa misma letra
  const lastPlayingKeyRef = useRef(null);

  if (!audioRef.current) audioRef.current = new Audio();

  useEffect(() => {
    const a = audioRef.current;
    const onEnded = () => setIsPlaying(false);
    const onError = () => setIsPlaying(false);

    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);

    // al cambiar de letra (id), corta audio y resetea bandera
    return () => {
      try {
        a.pause();
        a.currentTime = 0;
        a.src = "";
      } catch {}
      lastPlayingKeyRef.current = null;
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
    };
  }, [id]);

  const safeStopAudio = () => {
    try {
      const a = audioRef.current;
      a.pause();
      a.currentTime = 0;
      a.src = "";
    } catch {}
    setIsPlaying(false);
    lastPlayingKeyRef.current = null;
  };

  const play = async () => {
    const a = audioRef.current;
    try {
      if (!letter?.audio) return;

      // evita doble “tap” mientras ya suena la misma letra
      const key = `letter:${letter?.upper || ""}`;
      if (lastPlayingKeyRef.current === key && !a.paused) return;

      // reinicia cualquier reproducción previa
      if (!a.paused) {
        a.pause();
        a.currentTime = 0;
      }

      a.src = letter.audio;
      lastPlayingKeyRef.current = key;
      setIsPlaying(true);
      await a.play();

      // registrar progreso (escuchar letra)
      try {
        await logStudentProgress({
          kind: "letter",
          target: letter.upper,
          action: "listen",
          meta: { audio_url: letter.audio },
          score: 1.0,
          accuracy: 1.0,
          wpm: null,
          errors: {},
        });
      } catch (rpcErr) {
        // no romper la UI si falla RPC
        console.warn("No se pudo registrar progreso:", rpcErr?.message || rpcErr);
      }
    } catch (err) {
      console.error("Error al reproducir/registrar:", err?.message || err);
      setIsPlaying(false);
      lastPlayingKeyRef.current = null;
    }
  };

  // navegación segura (detener audio antes)
  const go = (slug) => {
    if (!slug) return;
    safeStopAudio();
    nav(`/estudiante/letras/${slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // logout estudiante (limpia audio + sesión local + Supabase)
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    safeStopAudio();
    try {
      await logoutStudent(); // borra localStorage + supabase.auth.signOut()
    } finally {
      nav("/login-estudiante", { replace: true });
    }
  };

  if (!letter) {
    return (
      <div className="container" style={{ padding: "24px" }}>
        <p>
          No encontré la letra/elemento: <b>{id}</b>.
        </p>
        <Link to="/estudiante" className="btn btn-student">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "16px 0" }}>
      {/* Barra superior */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "min(92vw, 960px)",
          margin: "0 auto 12px",
        }}
      >
        <HomeFab fixed={false} />
        {/* Si más adelante quieres reponer el botón de logout aquí, usa handleLogout */}
        {/* <button onClick={handleLogout} disabled={isLoggingOut} className="btn">🔒</button> */}
      </div>

      {/* Tarjeta */}
      <AlphabetCard
        image={letter.image}
        upper={letter.upper}
        lower={letter.lower}
        onPlay={play}
      />

      {/* Controles */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          marginTop: 16,
        }}
      >
        <button
          className="btn"
          onClick={() => go(prevId)}
          disabled={!prevId}
          style={{
            opacity: !prevId ? 0.5 : 1,
            cursor: !prevId ? "default" : "pointer",
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
          style={{
            opacity: !nextId ? 0.5 : 1,
            cursor: !nextId ? "default" : "pointer",
            fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
            fontWeight: 600,
          }}
        >
          Siguiente ⟶
        </button>
      </div>
    </div>
  );
}
