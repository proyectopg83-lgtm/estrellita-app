// src/services/progress.js
import { supabase } from "../lib/supabaseClient";
import { getStudentSession } from "./studentAuth";

/**
 * Registra un evento de progreso para el estudiante ACTUAL (sesión local).
 * kind: 'letter' | 'syllable' | 'word' | 'reading'
 * target: qué unidad (p.ej. 'A', 'ma', 'cuento-1#0')
 * action: 'listen' | 'record' | 'assess'
 * meta: { audio_url?, duration_sec?, ... }  (JSON libre)
 * score/accuracy en 0..1, wpm opcional, errors JSON opcional
 */
export async function logStudentProgress({
  kind,
  target,
  action = "listen",
  meta = {},
  score = null,
  wpm = null,
  accuracy = null,
  errors = {},
}) {
  const session = getStudentSession();
  const code = session?.student_code;
  if (!code) {
    // No romper UI si no hay sesión: sólo informar en consola
    console.warn("[progress] Sin sesión de estudiante; no se registró.");
    return null;
  }

  // Usamos la RPC segura creada en la BD: log_progress_by_code
  const payload = {
    p_code: code,
    p_kind: kind,
    p_target: String(target),
    p_action: String(action),
    p_meta: meta,
    p_score: score,
    p_wpm: wpm,
    p_accuracy: accuracy,
    p_errors: errors,
  };

  const { data, error } = await supabase.rpc("log_progress_by_code", payload);
  if (error) {
    console.error("[progress] RPC error:", error);
    throw error;
  }
  return data; // fila insertada (id, student_id, recorded_at)
}

/** (Opcional) Resumen simple por tipo/target para un alumno (por código) */
export async function getProgressByCode(code) {
  const clean = String(code || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const { data, error } = await supabase
    .from("progress_items")
    .select("id, kind, target, score, accuracy, wpm, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(200)
    .eq("student_id", supabase.rpc("get_student_id_by_code", { p_code: clean })); // si luego creas esa RPC
  if (error) throw error;
  return data;
}
