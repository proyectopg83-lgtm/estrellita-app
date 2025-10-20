// src/services/teacherReports.js
import { supabase } from "../lib/supabaseClient";

/** Lee el resumen de la vista para un alumno */
export async function fetchTeacherReportBasic(studentId) {
  const { data, error } = await supabase
    .from("v_teacher_report_basic")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/** Genera un informe en lenguaje natural (heurístico, cero costo IA) */
export function generateNarrative(report, studentName = "El/la estudiante") {
  if (!report) {
    return `${studentName} aún no tiene actividad registrada en el período analizado.`;
  }
  const {
    listens_letter = 0,
    listens_syllable = 0,
    sent_submitted = 0,
    sent_passed = 0,
    txt_submitted = 0,
    txt_passed = 0,
    last_activity = null,
  } = report;

  const sentRate = sent_submitted ? Math.round((sent_passed / sent_submitted) * 100) : 0;
  const txtRate  = txt_submitted  ? Math.round((txt_passed  / txt_submitted)  * 100) : 0;

  const partes = [];

  // Apertura
  const fecha = last_activity ? new Date(last_activity).toLocaleDateString() : "—";
  partes.push(`Última actividad: ${fecha}.`);

  // Conciencia fonológica (escuchas)
  if (listens_letter + listens_syllable === 0) {
    partes.push(`Aún no registra sesiones de escucha de letras o sílabas en los últimos 30 días.`);
  } else {
    partes.push(
      `En conciencia fonológica, registró ${listens_letter} letras y ${listens_syllable} sílabas escuchadas.`
    );
  }

  // Producción: oraciones
  if (sent_submitted === 0) {
    partes.push(`No hay oraciones evaluadas todavía.`);
  } else {
    const cuali =
      sentRate >= 85 ? "excelente" :
      sentRate >= 70 ? "buena" :
      sentRate >= 50 ? "en desarrollo" : "incipiente";
    partes.push(
      `En lectura de oraciones: ${sent_submitted} envíos, ${sent_passed} aprobadas (${sentRate}%, ${cuali}).`
    );
  }

  // Producción: textos
  if (txt_submitted === 0) {
    partes.push(`Aún no envía textos completos para evaluación.`);
  } else {
    const cualiT =
      txtRate >= 85 ? "sólida" :
      txtRate >= 70 ? "buena" :
      txtRate >= 50 ? "en desarrollo" : "incipiente";
    partes.push(
      `En lectura de textos: ${txt_submitted} envíos, ${txt_passed} aprobados (${txtRate}%, ${cualiT}).`
    );
  }

  // Recomendaciones automáticas
  const tips = [];
  if (listens_letter + listens_syllable < 5) {
    tips.push("Aumentar la práctica de escucha de letras/sílabas (objetivo: 10 por semana).");
  }
  if (sentRate < 70 && sent_submitted > 0) {
    tips.push("Practicar oraciones cortas, priorizando ritmo y articulación.");
  }
  if (txtRate < 70 && txt_submitted > 0) {
    tips.push("Fragmentar textos en párrafos y repetir lectura guiada.");
  }
  if (tips.length) {
    partes.push("Recomendaciones: " + tips.join(" "));
  }

  return partes.join(" ");
}
