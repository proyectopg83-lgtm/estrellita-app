// src/mock/localProgress.js

// ===== Claves (v2 + compat v1) =====
const PROGRESS_KEY_V2 = "estrellita_progress_v2";
const PROGRESS_KEY_V1 = "estrellita_progress"; // compat

function readAll() {
  let v2 = {};
  let v1 = {};
  try { v2 = JSON.parse(localStorage.getItem(PROGRESS_KEY_V2) || "{}"); } catch {}
  try { v1 = JSON.parse(localStorage.getItem(PROGRESS_KEY_V1) || "{}"); } catch {}
  // Prioriza v2; si no existe uid en v2, usa v1
  return { ...v1, ...v2 };
}
function writeAll(map) {
  localStorage.setItem(PROGRESS_KEY_V2, JSON.stringify(map || {}));
}
function ensureUser(map, uid) {
  if (!map[uid]) map[uid] = {};
  if (!map[uid].items) map[uid].items = {};
  return map;
}

// ===== API principal =====

export function getProgress(uid) {
  const all = readAll();
  return all[uid] || {};
}

// Porcentaje seguro de un área (letters/syllables/sentences/texts)
export function areaPercent(progress, area) {
  const v = progress?.[area];
  if (v == null) return 0;

  if (typeof v === "number") {
    return Math.max(0, Math.min(100, Math.round(v)));
  }
  const completed = Number(v.completed || 0);
  const total = Number(v.total || 0);
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
}

// Promedio simple de las áreas existentes
export function overallPercent(progress) {
  if (!progress || typeof progress !== "object") return 0;
  const areas = ["letters", "syllables", "sentences", "texts"].filter((k) => progress[k] != null);
  if (!areas.length) return 0;
  const sum = areas.reduce((acc, k) => acc + areaPercent(progress, k), 0);
  return Math.round(sum / areas.length);
}
export const overallPercentSafe = (p) => overallPercent(p);

// ===== Mutadores por área =====

export function setAreaTotal(uid, area, total) {
  const all = readAll();
  ensureUser(all, uid);
  const cur = all[uid][area] || { completed: 0, total: 0 };
  all[uid][area] = { ...cur, total: Number(total || 0) };
  writeAll(all);
  return all[uid][area];
}

export function setAreaCompleted(uid, area, completed) {
  const all = readAll();
  ensureUser(all, uid);
  const cur = all[uid][area] || { completed: 0, total: 0 };
  all[uid][area] = { ...cur, completed: Number(completed || 0) };
  writeAll(all);
  return all[uid][area];
}

export function incAreaCompleted(uid, area, delta = 1) {
  const all = readAll();
  ensureUser(all, uid);
  const cur = all[uid][area] || { completed: 0, total: 0 };
  const next = Number(cur.completed || 0) + Number(delta || 1);
  const capped = cur.total ? Math.min(next, Number(cur.total)) : next;
  all[uid][area] = { ...cur, completed: capped };
  writeAll(all);
  return all[uid][area];
}

// ===== Ítems (para oraciones/textos evaluados, etc.) =====

export function setItemStatus(uid, key, status) {
  // key sugerido: `${area}:${itemId}` p.ej. "sentences:m-03"
  const all = readAll();
  ensureUser(all, uid);
  all[uid].items[key] = { status, at: Date.now() };
  writeAll(all);
  return all[uid].items[key];
}

export function getUserItems(uid) {
  const all = readAll();
  return all[uid]?.items || {};
}

// ===== Recompute =====
export function recomputeArea(uid, area, data) {
  const all = readAll();
  ensureUser(all, uid);

  let totalN = 0;
  let completedN = 0;

  if (typeof data === "number") {
    totalN = Number(data || 0);
  } else if (data && typeof data === "object") {
    totalN = Number(data.total || 0);
    completedN = Number(data.completed || 0);
  }

  // Si no se proporcionó total, inferir desde items
  if (!totalN) {
    const items = all[uid].items || {};
    const keys = Object.keys(items).filter((k) => k.startsWith(area + ":"));
    totalN = keys.length;
    const okSet = new Set(["passed", "done", "complete", "approved"]);
    completedN = keys.filter((k) => okSet.has(items[k]?.status)).length;
  }

  all[uid][area] = { total: totalN, completed: Math.min(completedN, totalN) };
  writeAll(all);
  return all[uid][area];
}

// ===== Set Progress (flexible y global) =====
export function setProgress(uid, areaOrObj, maybeValue) {
  let all = readAll();
  ensureUser(all, uid);

  if (areaOrObj && typeof areaOrObj === "object" && !Array.isArray(areaOrObj)) {
    // Modo objeto: merge de áreas
    const patch = areaOrObj;
    for (const [area, val] of Object.entries(patch)) {
      if (typeof val === "number") {
        all[uid][area] = Math.max(0, Math.min(100, Math.round(val)));
      } else if (val && typeof val === "object") {
        const total = Number(val.total || 0);
        const completed = Math.min(Number(val.completed || 0), total || Infinity);
        all[uid][area] = { total, completed };
      }
    }
  } else if (typeof areaOrObj === "string") {
    // Modo por área específica
    const area = areaOrObj;
    const val = maybeValue;
    if (typeof val === "number") {
      all[uid][area] = Math.max(0, Math.min(100, Math.round(val)));
    } else if (val && typeof val === "object") {
      const total = Number(val.total || 0);
      const completed = Math.min(Number(val.completed || 0), total || Infinity);
      all[uid][area] = { total, completed };
    }
  }

  writeAll(all);
  return all[uid];
}
