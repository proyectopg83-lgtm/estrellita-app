// src/services/auth.js
import { supabase } from "../lib/supabaseClient";


const normEmail = (e) => String(e || "").trim().toLowerCase();

/* SIGN UP / SIGN IN / SIGN OUT */

/** Registro docente (opcional) */
export async function signUpTeacher({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email: normEmail(email),
    password: String(password || ""),
  });
  if (error) throw error;

  // OJO: si tienes "confirm email" activado, no habrá sesión aún.
  const user = data?.user ?? null;

  // (Opcional) Si ya hay sesión directa (sin confirmación), crea perfil teacher de una vez.
  if (user) {
    try {
      await ensureTeacherProfile({ fullName });
    } catch (_) {
    }
  }
  return user;
}

/** Login docente */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normEmail(email),
    password: String(password || ""),
  });
  if (error) throw error;
  const user = data?.user ?? null;
  if (!user) throw new Error("No se pudo iniciar sesión");
  return user;
}

/** Logout */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Usuario actual (o null) */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user ?? null;
}

/** Suscripción a cambios de sesión (cleanup incluido) */
export function onAuthStateChange(callback) {
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => {
    try {
      sub?.subscription?.unsubscribe();
    } catch {}
  };
}

/* PERFILES (docente) */

/**
 * Devuelve { user, role, teacher }.
 * Nota: En este proyecto los ESTUDIANTES NO usan Auth (entran por código).
 * Por eso 'role' aquí solo puede ser 'teacher' o null.
 */
export async function getProfilesAfterAuth() {
  // 1) Usuario actual
  const { data: uData, error: uErr } = await supabase.auth.getUser();
  if (uErr) throw uErr;
  const user = uData?.user ?? null;
  if (!user) return { user: null, role: null, student: null, teacher: null };

  // 2) Perfil de docente por auth_user_id
  const { data: teacher, error: tErr } = await supabase
    .from("teachers")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (tErr) throw tErr;

  const role = teacher ? "teacher" : null;
  return { user, role, student: null, teacher: teacher ?? null };
}

/** Asegura que exista el perfil del docente (crea si no existe) */
export async function ensureTeacherProfile({ fullName }) {
  const { data: uData, error: uErr } = await supabase.auth.getUser();
  if (uErr) throw uErr;
  const user = uData?.user ?? null;
  if (!user) throw new Error("No hay sesión.");

  // ¿ya existe?
  const { data: existing, error: e1 } = await supabase
    .from("teachers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (e1) throw e1;
  if (existing) return existing;

  // crear (RLS: with check auth.uid() = auth_user_id)
  const { data, error } = await supabase
    .from("teachers")
    .insert({
      auth_user_id: user.id,
      full_name: (fullName || user.user_metadata?.full_name || "").trim() || user.email,
      email: user.email,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

/** (Azúcar) Devuelve true si el usuario actual tiene perfil de docente */
export async function isTeacher() {
  const { role } = await getProfilesAfterAuth();
  return role === "teacher";
}
