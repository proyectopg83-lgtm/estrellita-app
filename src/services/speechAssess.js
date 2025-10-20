// src/services/speechAssess.js
import { supabase } from "../lib/supabaseClient";

/**
 * Guarda una evaluación de oración/texto usando la RPC segura (record_speech_assess).
 * Usa studentCode (no student_id) para respetar RLS.
 *
 * @param {object} p
 * @param {string} p.studentCode - Código del estudiante (ESTxxxxx)
 * @param {'sentence'|'text'} p.kind
 * @param {string} p.target     - Id del objetivo (ej: 'o1' o 'm:0'). Debe existir en curriculum_targets.
 * @param {number} p.accuracy   - 0..1
 * @param {string} p.transcript - Texto reconocido / leído
 * @returns {Promise<string>}   - id UUID insertado
 */
export async function saveAssessRPC({ studentCode, kind, target, accuracy, transcript }) {
  const { data, error } = await supabase.rpc("record_speech_assess", {
    p_student_code: studentCode,
    p_kind: kind,
    p_target: target,
    p_accuracy: accuracy,
    p_transcript: transcript,
  });

  if (error) throw error;
  return data;
}
