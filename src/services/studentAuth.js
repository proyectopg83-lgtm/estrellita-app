// src/services/studentAuth.js
import { supabase } from "../lib/supabaseClient";

const KEY = "student_session_v1";
// Posibles claves antiguas o auxiliares que queremos limpiar también
const LEGACY_KEYS = [
  "estrellita:student",
  "estrellita:student_session",
  "estrellita:last_route",
];

/* ------------------- Sesión local ------------------- */
export function saveStudentSession(student) {
  try {
    localStorage.setItem(KEY, JSON.stringify(student));
  } catch {}
}

export function getStudentSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStudentSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  // Limpia también posibles claves antiguas
  for (const k of LEGACY_KEYS) {
    try { localStorage.removeItem(k); } catch {}
    try { sessionStorage.removeItem(k); } catch {}
  }
}

/* ------------------- Normaliza código ------------------- */
function normalizeCode(code) {
  return String(code || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/* ------------------- Login por código ------------------- */
export async function loginStudentByCode(code) {
  const clean = normalizeCode(code);
  if (!clean) throw new Error("Ingresa tu código");

  // Intentar primero la RPC
  try {
    const { data, error } = await supabase.rpc("public_find_student_by_code", { p_code: clean });
    if (error) throw error;

    const student = Array.isArray(data) ? data[0] : data;
    if (!student) throw new Error("Código no encontrado o inactivo");
    if (student.status !== "active") throw new Error("Tu cuenta no está activa");

    saveStudentSession(student);
    return student;
  } catch (e) {
    console.warn("⚠️ RPC falló o no existe, usando SELECT directo:", e?.message);
  }

  // Fallback: SELECT directo (si la RPC no existe)
  const { data, error } = await supabase
    .from("students")
    .select("id, first_name, last_name, grade, status, student_code")
    .eq("student_code", clean)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Código no encontrado");
  if (data.status !== "active") throw new Error("Tu cuenta no está activa");

  saveStudentSession(data);
  return data;
}

/* ------------------- Logout completo ------------------- */
export async function logoutStudent() {
  try {
    // 1) Detener reconocimiento de voz si estaba activo (hook publica este stop)
    try {
      if (typeof window !== "undefined" && typeof window.__estrellitaStopSR === "function") {
        window.__estrellitaStopSR();
      }
    } catch {}

    // 2) Limpiar almacenamiento local/sesión (incluye claves legacy)
    clearStudentSession();

    // 3) Cerrar sesión de Supabase (si hubiese)
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("No había sesión de Supabase activa:", err?.message);
    }
  } finally {
    // 4) Navegación dura al login del estudiante (evita loops/errores de History)
    if (typeof window !== "undefined") {
      window.location.replace("/login-estudiante");
    }
  }
}
