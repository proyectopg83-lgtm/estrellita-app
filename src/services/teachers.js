import { supabase } from '../lib/supabaseClient';
import { getCurrentUser } from './auth';

/** Devuelve la fila de teachers del usuario actual */
export async function getMyTeacher() {
  const u = await getCurrentUser();
  if (!u) return null;
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('auth_user_id', u.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Actualiza nombre/email del docente actual */
export async function updateMyTeacher({ full_name, email }) {
  const me = await getMyTeacher();
  if (!me) throw new Error('Perfil docente no encontrado');
  const { data, error } = await supabase
    .from('teachers')
    .update({ full_name, email })
    .eq('id', me.id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
