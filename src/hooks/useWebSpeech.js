// Reconocimiento de voz nativo del navegador (Chrome/Edge/Android; Safari usa webkit*)
// Idioma: español (es-ES). Devuelve transcript en tiempo real.
import { useEffect, useRef, useState } from "react";

function makeRecognizer() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.lang = "es-ES";
  r.continuous = true;
  r.interimResults = true;
  return r;
}

export default function useWebSpeech() {
  const [supported, setSupported] = useState(
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognizerRef = useRef(null);
  const accFinalRef = useRef(""); // acumulador de finales

  useEffect(() => {
    if (!supported) return;

    const r = makeRecognizer();
    recognizerRef.current = r;
    accFinalRef.current = "";

    r.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) {
          accFinalRef.current += (res[0].transcript || "") + " ";
        } else {
          interim += res[0].transcript || "";
        }
      }
      const txt = (accFinalRef.current + " " + interim).trim();
      setTranscript(txt);
    };

    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);

    return () => {
      try { r.stop(); } catch {}
    };
  }, [supported]);

  const start = () => {
    if (!supported || !recognizerRef.current) return;
    accFinalRef.current = "";
    setTranscript("");
    try {
      recognizerRef.current.start();
      setListening(true);
    } catch {}
  };

  const stop = () => {
    if (!supported || !recognizerRef.current) return;
    try { recognizerRef.current.stop(); } catch {}
  };

  return { supported, listening, transcript, start, stop, setTranscript };
}
