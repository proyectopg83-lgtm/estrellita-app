// src/utils/progress.js
import {
  // lectura / escritura
  getProgress,
  setAreaTotal,
  setAreaCompleted,
  setItemStatus,
  recomputeArea,
  // lectura de % (opcionalmente útiles)
  areaPercent,
  overallPercent,
} from "../mock/localProgress.js";

// ---------- Helpers de claves ----------
export const keySentence = (setId, idx) => `sentences:${setId}:${idx}`;
export const keyText = (setId) => `texts:${setId}`;

// ---------- Estados intermedios (no tocan % todavía) ----------
/** Marca un estado intermedio (p.ej. "recorded", "submitted"). */
export function markIntermediate(uid, area, key, status) {
  // No recalcula %; sólo deja constancia del estado.
  setItemStatus(uid, key, status);
}

// ---------- Resultado evaluado (sí toca %) ----------
/** Marca evaluación (passed/failed) y recalcula el % del área. */
export function markAssessed(uid, area, key, passed) {
  setItemStatus(uid, key, passed ? "passed" : "failed");
  // Nota: recomputeArea infiere total/completados contando items que
  // empiezan con `${area}:` y con status "passed|done|complete|approved".
  recomputeArea(uid, area);
}

// ---------- Avance por índice (letras/sílabas) ----------
/**
 * Avanza por índice para áreas que no usan items (letras/sílabas).
 * - total: número total de elementos del área.
 * - idx0: índice actual (base 0). Ej: si estás en la 4ª letra, idx0 = 3.
 */
export function bumpProgress(uid, area, total, idx0) {
  const prev = getProgress(uid)?.[area] || { completed: 0, total: 0 };
  // Asegura el total si viene (o conserva el existente)
  if (typeof total === "number") setAreaTotal(uid, area, total);
  // completed = máximo entre lo previo y (idx+1)
  const nextCompleted = Math.max(Number(prev.completed || 0), Number(idx0 || 0) + 1);
  setAreaCompleted(uid, area, nextCompleted);
}

// ---------- Lectura de porcentajes (por si te sirven en UI) ----------
export function readPercents(uid) {
  const p = getProgress(uid);
  return {
    letters: areaPercent(p, "letters"),
    syllables: areaPercent(p, "syllables"),
    sentences: areaPercent(p, "sentences"),
    texts: areaPercent(p, "texts"),
    overall: overallPercent(p),
  };
}
