// src/hooks/useWebSpeech.js
import { useCallback, useEffect, useRef, useState } from "react";

function getSR() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SR || null;
}

function isMobileUA() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Quita duplicados contiguos: "mama mama me mima" -> "mama me mima"
function dedupeAdjacentWords(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const clean = [];
  for (let i = 0; i < words.length; i++) {
    if (i === 0 || words[i] !== words[i - 1]) clean.push(words[i]);
  }
  return clean.join(" ");
}

export function useWebSpeech({ lang = "es-ES" } = {}) {
  const SR = getSR();
  const [supported] = useState(!!SR);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef(null);
  const lastStableRef = useRef("");
  const userWantedRef = useRef(false);

  useEffect(() => {
    if (!SR) return;
    const mobile = isMobileUA();
    const rec = new SR();

    rec.lang = lang;                  // "es-ES" o "es-419"
    rec.interimResults = false;       // móviles duplican si true
    rec.continuous = !mobile;         // desktop: continuo; móvil: sesiones cortas
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const current = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();

      // Normaliza duplicados inmediatos
      let clean = dedupeAdjacentWords(current);

      // Si el bloque actual incluye lo ya estable, toma solo lo nuevo
      const last = lastStableRef.current;
      if (clean.toLowerCase().startsWith(last.toLowerCase())) {
        clean = clean.slice(last.length).trim();
      }

      const next = (last + " " + clean).trim();
      if (next && next !== last) {
        lastStableRef.current = next;
        setTranscript(next);
      }
    };

    rec.onerror = () => { /* opcional: log */ };
    rec.onend = () => {
      setListening(false);
      // En móviles, reiniciar controladamente si el usuario sigue grabando
      if (userWantedRef.current && isMobileUA()) {
        try { rec.start(); setListening(true); } catch {}
      }
    };

    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
      recRef.current = null;
    };
  }, [SR, lang]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    userWantedRef.current = true;
    lastStableRef.current = "";
    setTranscript("");
    try {
      // importante: invocar desde un gesto del usuario (onClick)
      recRef.current.start();
      setListening(true);
    } catch {}
  }, []);

  const stop = useCallback(() => {
    userWantedRef.current = false;
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch {}
  }, []);

  const reset = useCallback(() => {
    lastStableRef.current = "";
    setTranscript("");
  }, []);

  return {
    supported,
    listening,
    transcript,
    start,
    stop,
    reset,
    // 👇 compatibilidad hacia atrás: algunos componentes aún llaman setTranscript(...)
    setTranscript,
  };
}

export default useWebSpeech;
