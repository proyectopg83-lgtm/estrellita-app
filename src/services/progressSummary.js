import { supabase } from "../lib/supabaseClient";

/**
 * Lee la vista v_student_progress_summary para un conjunto de alumnos.
 * Devuelve Map<studentId, {letters, syllables, sentences, texts, overallPct}>
 */
export async function fetchCurricularSummary(studentIds = []) {
  if (!studentIds.length) return new Map();

  const { data, error } = await supabase
    .from("v_student_progress_summary")
    .select("*")
    .in("student_id", studentIds);

  if (error) throw error;

  const pct = (done, tot) => {
    const d = Number(done || 0), t = Number(tot || 0);
    if (!t) return 0;
    return Math.max(0, Math.min(100, Math.round((d / t) * 100)));
  };

  const map = new Map();
  for (const r of data || []) {
    const pLetters   = pct(r.letters_completed,   r.letters_total);
    const pSyllables = pct(r.syllables_completed, r.syllables_total);
    const pSentences = pct(r.sentences_completed, r.sentences_total);
    const pTexts     = pct(r.texts_completed,     r.texts_total);

    const areas = [pLetters, pSyllables, pSentences, pTexts];
    const present = [
      r.letters_total, r.syllables_total, r.sentences_total, r.texts_total
    ].map(n => Number(n || 0) > 0);
    const list = areas.filter((_, i) => present[i]);
    const overallPct = list.length ? Math.round(list.reduce((a,b)=>a+b,0)/list.length) : 0;

    map.set(r.student_id, {
      letters:   { completed: r.letters_completed   || 0, total: r.letters_total   || 0, percent: pLetters },
      syllables: { completed: r.syllables_completed || 0, total: r.syllables_total || 0, percent: pSyllables },
      sentences: { completed: r.sentences_completed || 0, total: r.sentences_total || 0, percent: pSentences },
      texts:     { completed: r.texts_completed     || 0, total: r.texts_total     || 0, percent: pTexts },
      overallPct,
    });
  }
  return map;
}
