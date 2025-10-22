// src/pages/SentencesPage.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import HomeFab from "../components/HomeFab.jsx";
import { SENTENCE_SETS, findSentenceSet } from "../data/sentences.js";
import { useAuth } from "../auth.jsx";

// progreso local de tu UI
import { keySentence, keyText, markIntermediate, markAssessed } from "../utils/progress";

// sesión alumno (para student_code) + RPC segura
import { getStudentSession } from "../services/studentAuth.js";
import { saveAssessRPC } from "../services/speechAssess.js";

// reconocimiento de voz (Web Speech)
import useWebSpeech from "../hooks/useWebSpeech";

// ====== UI helpers ======
const btnBase = {
  border: "none",
  borderRadius: 12,
  padding: "0.7rem 1.2rem",
  fontWeight: 800,
  boxShadow: "0 6px 12px rgba(0,0,0,.08)",
  transition: "transform .05s ease, opacity .2s",
  fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
};
const btn = (bg, disabled = false, color = "#0b3b58") => ({
  ...btnBase,
  background: disabled ? "#e5e5e5" : bg,
  color: disabled ? "#8d8d8d" : color,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.75 : 1,
});
const card = {
  background: "#fff",
  borderRadius: 20,
  padding: "1.2rem",
  width: "min(96vw, 640px)",
  boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
};

// ====== precisión: normalización + WER/CER ======
function normalizeEs(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function collapseConsecutiveRepeats(tokens) {
  const out = [];
  for (const t of tokens) if (!out.length || out[out.length - 1] !== t) out.push(t);
  return out;
}
function editDistance(ref, hyp) {
  const m = ref.length, n = hyp.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = ref[i - 1] === hyp[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}
function accuracyWER(expected, actual) {
  const ref = collapseConsecutiveRepeats(normalizeEs(expected).split(" ").filter(Boolean));
  const hyp = collapseConsecutiveRepeats(normalizeEs(actual).split(" ").filter(Boolean));
  if (!ref.length) return 0;
  const dist = editDistance(ref, hyp);
  return Math.max(0, Math.min(1, 1 - dist / ref.length));
}
function accuracyCER(expected, actual) {
  const a = normalizeEs(expected).replace(/ /g, "");
  const b = normalizeEs(actual).replace(/ /g, "");
  if (!a.length) return 0;
  const dist = editDistance(a.split(""), b.split(""));
  return Math.max(0, Math.min(1, 1 - dist / a.length));
}
function combinedAccuracy(expected, actual) {
  const wer = accuracyWER(expected, actual);
  const cer = accuracyCER(expected, actual);
  return (wer + cer) / 2;
}

// ====== helpers de tokens ======
function tokensEs(s) { return normalizeEs(s).split(" ").filter(Boolean); }
function multisetCount(arr) {
  const m = new Map();
  for (const x of arr) m.set(x, (m.get(x) || 0) + 1);
  return m;
}
function multisetDiff(a, b) {
  const out = [];
  const mb = multisetCount(b);
  for (const x of a) {
    const left = mb.get(x) || 0;
    if (left > 0) mb.set(x, left - 1);
    else out.push(x);
  }
  return out;
}
function findConsecutiveRepeats(arr) {
  const reps = [];
  for (let i = 1; i < arr.length; i++) if (arr[i] === arr[i - 1]) reps.push(arr[i]);
  return reps;
}

// ====== NUEVO: recall por tokens para Textos ======
function recallAccuracy(expected, actual) {
  const ref = tokensEs(expected);
  const hyp = tokensEs(actual);
  if (!ref.length) return 0;
  const hCount = multisetCount(hyp);
  let matches = 0;
  for (const t of ref) {
    const c = hCount.get(t) || 0;
    if (c > 0) { matches += 1; hCount.set(t, c - 1); }
  }
  return matches / ref.length;
}

// ====== Feedback pedagógico ======
function buildFeedbackTips(expected, actual, acc) {
  const ref = tokensEs(expected);
  const hyp = tokensEs(actual);
  const missing = multisetDiff(ref, hyp);
  const extras  = multisetDiff(hyp, ref);
  const repeats = findConsecutiveRepeats(hyp);
  const tips = [];

  if (acc >= 0.9) tips.push("Excelente lectura. ¡Sigue así!");
  else if (acc >= 0.8) tips.push("Muy bien. Solo afina un poquito la pronunciación.");
  else if (acc >= 0.6) tips.push("Bien. Intenta leer más despacio y con claridad.");
  else tips.push("Vamos de nuevo: respira, escucha y repite frase por frase.");

  if (missing.length) {
    const show = [...new Set(missing)].slice(0, 3).join(", ");
    tips.push(`No olvides: ${show}.`);
  }
  if (extras.length >= 2) tips.push("Evita añadir palabras que no están en la oración.");
  if (repeats.length) tips.push("Evita repetir palabras (di cada palabra una sola vez).");
  if (hyp.length >= ref.length * 1.6) tips.push("Parece que agregaste varias palabras. Lee solo lo que escuchas.");
  else if (hyp.length <= ref.length * 0.6) tips.push("Faltaron varias palabras. Lee la oración completa.");
  tips.push("Consejo: repite pausado y claro. ¡Tú puedes!");

  return tips;
}

// ====== TTS ======
function speakFeedback(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "es-ES";
  utter.rate = 1.0;
  try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(utter); } catch {}
}

export default function SentencesPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const set = findSentenceSet(id);
  const isText = set?.type === "text";

  const [idx, setIdx] = useState(0);
  const currentSentence = useMemo(
    () => (!isText ? set?.sentences?.[idx] || null : null),
    [isText, set, idx]
  );
  const hasPrev = !isText && idx > 0;
  const hasNext = !isText && idx < (set?.sentences?.length || 0) - 1;

  //  Hook de voz
  const { supported, listening, transcript, start, stop, reset } = useWebSpeech();

  //  Detener el reconocimiento si el usuario navega fuera de esta página
  useEffect(() => {
    return () => {
      try { stop(); } catch {}
    };
  }, [stop]);

  const [resultAccuracy, setResultAccuracy] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackTips, setFeedbackTips] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    reset();
    setResultAccuracy(null);
    setFeedback("");
    setFeedbackTips([]);
    setErrorMsg("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, idx]);

  if (!set) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <p>No se encontró contenido para <b>{id}</b></p>
        <Link className="btn" to="/estudiante">Volver</Link>
      </div>
    );
  }

  const fullText = isText
    ? (set?.paragraphs?.join(" ") || set?.title || "")
    : "";
  const expectedText = isText ? fullText : (currentSentence?.text || "");

  const totalSentencesAll = SENTENCE_SETS
    .filter(s => s.type === "sentences")
    .reduce((a, s) => a + (s.sentences?.length || 0), 0);

  const goText = (slug) => {
    if (!slug) return;
    nav(`/estudiante/oraciones/${slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIdx(0);
  };

  const prev = () => { if (!hasPrev) return; setIdx(v => v - 1); };
  const next = () => { if (!hasNext) return; setIdx(v => v + 1); };

  const handleStart = () => {
    if (!supported) {
      setErrorMsg("Tu navegador no soporta reconocimiento de voz (Web Speech). Prueba Chrome/Edge o Safari en iOS.");
      return;
    }
    setErrorMsg("");
    reset();
    setResultAccuracy(null);
    setFeedback("");
    setFeedbackTips([]);
    start();
  };
  const handleStop = () => stop();

  const handleSave = async () => {
    if (!transcript) {
      setErrorMsg("No hay transcripción. Graba primero con “Grabar lectura”.");
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg("");

      let acc;
      if (isText && Array.isArray(set?.paragraphs) && set.paragraphs.length) {
        const accs = set.paragraphs.map(p => recallAccuracy(p, transcript));
        acc = accs.reduce((a, b) => a + b, 0) / accs.length;
      } else {
        acc = combinedAccuracy(expectedText, transcript);
      }
      setResultAccuracy(acc);

      const tips = buildFeedbackTips(expectedText, transcript, acc);
      setFeedbackTips(tips);
      setFeedback(
        acc >= 0.8 ? "✅ ¡Muy bien!" :
        acc >= 0.6 ? "🟡 Bien, puedes mejorar." :
        "🔴 Repite de nuevo con calma."
      );
      if (tips[0]) speakFeedback(tips[0]);

      const area = isText ? "texts" : "sentences";
      const key = isText ? keyText(id) : keySentence(id, idx);
      markIntermediate(user?.uid || "guest", area, key, "submitted");

      const session = getStudentSession();
      const studentCode =
        session?.student?.student_code ||
        session?.student_code ||
        session?.code ||
        null;

      if (!studentCode) {
        setErrorMsg("No hay código de estudiante en la sesión.");
      } else {
        const kind = isText ? "text" : "sentence";
        const target = isText ? set.id : `${set.id}:${idx}`;

        await saveAssessRPC({
          studentCode,
          kind,
          target,
          accuracy: acc,
          transcript,
        });

        if (isText) {
          const totalTexts = SENTENCE_SETS.filter(s => s.type === "text").length;
          markAssessed(user?.uid || "guest", "texts", key, acc >= 0.8, totalTexts, "texts:");
        } else {
          markAssessed(user?.uid || "guest", "sentences", key, acc >= 0.8, totalSentencesAll, "sentences:");
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || "No se pudo guardar el resultado.");
    } finally {
      setSubmitting(false);
    }
  };

  const textSets = useMemo(() => SENTENCE_SETS.filter(s => s.type === "text"), []);
  const textIndex = useMemo(() => textSets.findIndex(s => s.id === id), [textSets, id]);
  const prevTextId = textIndex > 0 ? textSets[textIndex - 1].id : null;
  const nextTextId = textIndex >= 0 && textIndex < textSets.length - 1 ? textSets[textIndex + 1].id : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #cce9ff, #f9fff5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem",
      }}
    >
      <header
        style={{
          width: "min(96vw, 1000px)",
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <HomeFab fixed={false} />
      </header>

      <h2
        style={{
          fontSize: "1.9rem",
          color: "#283b6a",
          margin: "6px 0 14px",
          textAlign: "center",
        }}
      >
        {isText ? "Textos" : "Oraciones"}
      </h2>

      {errorMsg && (
        <div
          style={{
            background: "#fdecea",
            color: "#b91c1c",
            padding: 10,
            borderRadius: 10,
            marginBottom: 8,
            width: "min(96vw, 640px)",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* ====== ORACIONES ====== */}
      {!isText && currentSentence && (
        <>
          <div style={card}>
            {currentSentence.image && (
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <img
                  src={currentSentence.image}
                  alt="ilustración"
                  style={{ width: "72%", maxWidth: 240, height: "auto", borderRadius: 12 }}
                />
              </div>
            )}

            <p
              style={{
                fontSize: "1.6rem",
                color: "#1d2d50",
                fontWeight: 700,
                margin: "0 0 12px",
                textAlign: "center",
              }}
            >
              {currentSentence.text}
            </p>

            <div style={{ display: "grid", gap: 10, placeItems: "center" }}>
              <button onClick={listening ? handleStop : handleStart} style={btn("#9BFF75")}>
                {listening ? "⏹️ Detener" : "🎙️ Grabar lectura"}
              </button>

              <button onClick={handleSave} disabled={!transcript || submitting} style={btn("#dff4ff", !transcript || submitting)}>
                {submitting ? "Guardando..." : "💾 Guardar resultado"}
              </button>

              {(transcript || resultAccuracy !== null) && (
                <section
                  style={{
                    width: "100%",
                    maxWidth: 560,
                    background: "#f8fafc",
                    borderRadius: 12,
                    padding: 12,
                    boxShadow: "0 8px 18px rgba(0,0,0,.06)",
                    textAlign: "left",
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: 8, color: "#1d2d50" }}>Resultado</h3>
                  {transcript && (
                    <p style={{ margin: "6px 0" }}>
                      <b>Transcripción:</b> <i>{transcript}</i>
                    </p>
                  )}
                  {resultAccuracy !== null && (
                    <p style={{ margin: "6px 0" }}>
                      <b>Precisión:</b> {Math.round(resultAccuracy * 100)}%
                    </p>
                  )}
                  {feedback && (
                    <p style={{ margin: "6px 0", color: "#234", fontWeight: 700 }}>
                      {feedback}
                    </p>
                  )}
                  {feedbackTips.length > 0 && (
                    <ul style={{ marginTop: 8, paddingLeft: 18, color: "#334155" }}>
                      {feedbackTips.map((t, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{t}</li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: 20 }}>
            <button onClick={prev} disabled={!hasPrev} style={btn("#a3d2ff", !hasPrev, "#082a4b")}>⬅ Anterior</button>
            <button onClick={next} disabled={!hasNext} style={btn("#4dc3ff", !hasNext, "#052538")}>Siguiente ➡</button>
          </div>
        </>
      )}

      {/* ====== TEXTOS (CUENTOS) ====== */}
      {isText && (
        <>
          <div style={card}>
            {set.image && (
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <img
                  src={set.image}
                  alt={set.title}
                  style={{ width: "70%", maxWidth: 300, height: "auto", borderRadius: 12 }}
                />
              </div>
            )}

            <div style={{ display: "grid", gap: 10 }}>
              {set.paragraphs?.map((p, i) => (
                <p key={i} style={{ fontSize: "1.2rem", lineHeight: 1.6, color: "#1d2d50", margin: 0 }}>
                  {p}
                </p>
              ))}
            </div>

            <div style={{ display: "grid", gap: 10, placeItems: "center", marginTop: 14 }}>
              <button onClick={listening ? handleStop : handleStart} style={btn("#9BFF75")}>
                {listening ? "⏹️ Detener" : "🎙️ Grabar lectura"}
              </button>
              <button onClick={handleSave} disabled={!transcript || submitting} style={btn("#dff4ff", !transcript || submitting)}>
                {submitting ? "Guardando..." : "💾 Guardar resultado"}
              </button>

              {(transcript || resultAccuracy !== null) && (
                <section
                  style={{
                    width: "100%",
                    background: "#f8fafc",
                    borderRadius: 12,
                    padding: 12,
                    boxShadow: "0 8px 18px rgba(0,0,0,.06)",
                    textAlign: "left",
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: 8, color: "#1d2d50" }}>Resultado</h3>
                  {transcript && (
                    <p style={{ margin: "6px 0" }}>
                      <b>Transcripción:</b> <i>{transcript}</i>
                    </p>
                  )}
                  {resultAccuracy !== null && (
                    <p style={{ margin: "6px 0" }}>
                      <b>Precisión:</b> {Math.round(resultAccuracy * 100)}%
                    </p>
                  )}
                  {feedback && (
                    <p style={{ margin: "6px 0", color: "#234", fontWeight: 700 }}>
                      {feedback}
                    </p>
                  )}
                  {feedbackTips.length > 0 && (
                    <ul style={{ marginTop: 8, paddingLeft: 18, color: "#334155" }}>
                      {feedbackTips.map((t, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{t}</li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: 20 }}>
            <button onClick={() => goText(textIndex > 0 ? textSets[textIndex - 1].id : null)}
                    disabled={!(textIndex > 0)} style={btn("#a3d2ff", !(textIndex > 0), "#082a4b")}>
              ⬅ Texto anterior
            </button>
            <button onClick={() => goText(textIndex >= 0 && textIndex < textSets.length - 1 ? textSets[textIndex + 1].id : null)}
                    disabled={!(textIndex >= 0 && textIndex < textSets.length - 1)} style={btn("#4dc3ff", !(textIndex >= 0 && textIndex < textSets.length - 1), "#052538")}>
              Siguiente texto ➡
            </button>
          </div>
        </>
      )}
    </div>
  );
}
