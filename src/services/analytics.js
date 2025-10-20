// src/services/analytics.js
import { supabase } from "../lib/supabaseClient";

/**
 * Resumen por docente (usa la vista v_teacher_overview).
 * Devuelve filas por kind: letter | syllable | sentence | text
 * Campos: teacher_id, kind, total_events, avg_accuracy, students_active, first_event, last_event
 */
export async function fetchTeacherOverview() {
  const { data, error } = await supabase
    .from("v_teacher_overview")
    .select("*");
  if (error) throw error;
  return data || [];
}

/**
 * KPIs por alumno y tipo (usa v_kpis_by_kind)
 * Devuelve filas por kind con attempts, avg_accuracy, listens, productions
 */
export async function fetchStudentKpis(studentId) {
  if (!studentId) return [];
  const { data, error } = await supabase
    .from("v_kpis_by_kind")
    .select("*")
    .eq("student_id", studentId);
  if (error) throw error;
  return data || [];
}

/**
 * Serie temporal diaria de precisión por alumno (usa v_student_daily_accuracy)
 * Devuelve: { student_id, day, avg_accuracy }
 */
export async function fetchStudentDailyAccuracy(studentId) {
  if (!studentId) return [];
  const { data, error } = await supabase
    .from("v_student_daily_accuracy")
    .select("*")
    .eq("student_id", studentId)
    .order("day", { ascending: true });
  if (error) throw error;
  return data || [];
}
