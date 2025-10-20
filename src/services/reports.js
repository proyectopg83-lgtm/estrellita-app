// src/services/reports.js
import { supabase } from "../lib/supabaseClient";

// Totales de tu catálogo (ajústalos si cambian)
export const TOTALS = {
  LETTERS: 29,
  SYLLABLES: 80,
  SENTENCES: 5,
  TEXTS: 3,
};

/**
 * Lee v_teacher_report_basic y devuelve Map(student_id -> summary)
 * Estructura que devuelve por alumno:
 * {
 *   overallPct: number,             // 0..100
 *   letters:   { completed, total, percent },
 *   syllables: { completed, total, percent },
 *   sentences: { completed, total, percent }, // aprobadas
 *   texts:     { completed, total, percent }, // aprobados
 * }
 */
export async function fetchTeacherReport(studentIds) {
  if (!studentIds?.length) return new Map();

  const { data, error } = await supabase
    .from("v_teacher_report_basic")
    .select("*")
    .in("student_id", studentIds);

  if (error) throw error;

  const out = new Map();

  for (const r of data || []) {
    const listensLetter   = Number(r?.listens_letter   ?? 0);
    const listensSyllable = Number(r?.listens_syllable ?? 0);
    const sentPassed      = Number(r?.sent_passed      ?? 0);
    const txtPassed       = Number(r?.txt_passed       ?? 0);

    const lettersPct   = Math.round(100 * listensLetter   / TOTALS.LETTERS);
    const syllablesPct = Math.round(100 * listensSyllable / TOTALS.SYLLABLES);
    const sentencesPct = Math.round(100 * sentPassed      / TOTALS.SENTENCES);
    const textsPct     = Math.round(100 * txtPassed       / TOTALS.TEXTS);

    const overallPct   = Math.round((lettersPct + syllablesPct + sentencesPct + textsPct) / 4);

    out.set(r.student_id, {
      overallPct,
      letters:   { completed: listensLetter,   total: TOTALS.LETTERS,   percent: lettersPct },
      syllables: { completed: listensSyllable, total: TOTALS.SYLLABLES, percent: syllablesPct },
      sentences: { completed: sentPassed,      total: TOTALS.SENTENCES, percent: sentencesPct },
      texts:     { completed: txtPassed,       total: TOTALS.TEXTS,     percent: textsPct },
      last_activity: r?.last_activity ?? null,
    });
  }

  return out;
}
