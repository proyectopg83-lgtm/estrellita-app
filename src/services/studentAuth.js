// src/services/studentAuth.js
import { supabase } from "../lib/supabaseClient";

const KEY = "student_session_v1";

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
    console.warn("⚠️ RPC falló o no existe, usando SELECT directo:", e.message);
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
  // 1️⃣ Limpia datos locales
  clearStudentSession();

  // 2️⃣ Limpia cualquier sesión de Supabase (si existe)
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("No había sesión de Supabase activa:", err.message);
  }
}
