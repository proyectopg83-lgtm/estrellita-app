import { supabase } from "../lib/supabaseClient";
import { getMyTeacher } from "./teachers";


/** Lista los alumnos del docente actual */
export async function getStudentsByCurrentTeacher() {
  const me = await getMyTeacher();
  if (!me) return [];
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("teacher_id", me.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Crear alumno manual  */
export async function createStudentManual({ first_name, last_name, grade, dob }) {
  const me = await getMyTeacher();
  if (!me) throw new Error("Docente no encontrado");
  const { data, error } = await supabase
    .from("students")
    .insert([
      {
        teacher_id: me.id,
        first_name,
        last_name,
        grade,
        status: "active",
        dob: dob || null, // guardamos DOB real
      },
    ])
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**  Cambiar estado de alumno (active / blocked) */
export async function updateStudentStatus({ id, status }) {
  const { data, error } = await supabase
    .from("students")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**  Editar información de alumno */
export async function updateStudentInfo({ id, first_name, last_name, grade, dob }) {
  const payload = { first_name, last_name, grade };
  if (dob !== undefined) payload.dob = dob || null;
  const { data, error } = await supabase
    .from("students")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** Eliminar alumno */
export async function removeStudent(id) {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/*Trae nombre*/ 
export async function getStudentById(id) {
  const { data, error } = await supabase
    .from("students")
    .select("id, first_name, last_name, status, student_code")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}