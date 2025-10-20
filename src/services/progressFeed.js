// src/services/progressFeed.js
import { supabase } from "../lib/supabaseClient";

/**
 * Obtiene progreso reciente del estudiante.
 * Puedes pasar un número (interpreta como windowDays) o un objeto:
 *  { windowDays=60, limit=200, kinds=null }  // kinds: array de tipos o null para sin filtro
 * Si windowDays = 0 => SIN filtro de fecha.
 */
export async function fetchRecentProgress(studentId, opts = {}) {
  const windowDays = typeof opts === "number" ? opts : (opts.windowDays ?? 60);
  const limit = typeof opts === "number" ? 200 : (opts.limit ?? 200);
  const kinds =
    Array.isArray(opts.kinds) && opts.kinds.length
      ? opts.kinds.map((k) => String(k).toLowerCase())
      : null;

  try {
    let q = supabase
      .from("progress_items")
      .select("id, student_id, kind, target, action, score, accuracy, recorded_at")
      .eq("student_id", studentId)
      .order("recorded_at", { ascending: false })
      .limit(limit);

    if (windowDays > 0) {
      const since = new Date();
      since.setDate(since.getDate() - windowDays);
      q = q.gte("recorded_at", since.toISOString());
    }

    if (kinds) q = q.in("kind", kinds);

    const { data, error } = await q;
    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("[fetchRecentProgress] Error:", err?.message || err);
    throw err;
  }
}

/** Suscripción en tiempo real a progress_items de un estudiante */
export function subscribeProgress(studentId, onInsert) {
  const channel = supabase
    .channel(`realtime:progress_items:${studentId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "progress_items",
        filter: `student_id=eq.${studentId}`,
      },
      (payload) => {
        const row = payload?.new || payload?.record || null;
        if (row) onInsert?.(row);
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {
      // no-op
    }
  };
}

/**
 * Resumen simple de progreso (media de accuracy en ventana móvil).
 * Reglas:
 *  - Solo actions reales: record/assess
 *  - accuracy numérica (0..1)
 *  - Si n < minSamples => progress = 0
 *
 * Devuelve Map studentId -> { progressPct, lastRecordedAt, sampleCount, hasEnoughEvidence }
 */
export async function fetchProgressSummaryForStudents(
  studentIds = [],
  { windowDays = 30, minSamples = 5 } = {}
) {
  if (!studentIds.length) return new Map();

  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  try {
    const { data, error } = await supabase
      .from("progress_items")
      .select("student_id, kind, target, action, accuracy, recorded_at")
      .in("student_id", studentIds)
      .gte("recorded_at", since.toISOString())
      .order("recorded_at", { ascending: false });

    if (error) throw error;

    const byStudent = new Map();
    for (const r of data || []) {
      const id = r.student_id;
      if (!byStudent.has(id)) {
        byStudent.set(id, { lastRecordedAt: null, validAcc: [] });
      }
      const st = byStudent.get(id);
      if (!st.lastRecordedAt) st.lastRecordedAt = r.recorded_at;

      const isRealAction = r.action === "record" || r.action === "assess";
      const accNum = Number(r.accuracy);
      if (isRealAction && Number.isFinite(accNum)) st.validAcc.push(accNum);
    }

    const result = new Map();
    for (const id of studentIds) {
      const st = byStudent.get(id);
      if (!st) {
        result.set(id, {
          progressPct: 0,
          lastRecordedAt: null,
          sampleCount: 0,
          hasEnoughEvidence: false,
        });
        continue;
      }
      const n = st.validAcc.length;
      const hasEnoughEvidence = n >= minSamples;
      let pct = 0;
      if (hasEnoughEvidence) {
        const sum = st.validAcc.reduce((a, b) => a + b, 0);
        pct = Math.max(0, Math.min(100, Math.round((sum / n) * 100)));
      }
      result.set(id, {
        progressPct: pct,
        lastRecordedAt: st.lastRecordedAt || null,
        sampleCount: n,
        hasEnoughEvidence,
      });
    }
    return result;
  } catch (err) {
    console.error("[fetchProgressSummaryForStudents] Error:", err?.message || err);
    throw err;
  }
}
