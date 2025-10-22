
// src/mock/localAccess.js  (con migración de storage)


const TEACHERS_KEY = "estrellita_teachers";
const ADMIN_KEY    = "estrellita_admin";

// --- helpers básicos
function readRaw(key) {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}
function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// --- normalizador/migración de docentes ---
// Asegura que TEACHERS_KEY sea SIEMPRE un objeto { [teacherId]: teacher }
function getTeachersMap() {
  let data = readRaw(TEACHERS_KEY);

  // si no hay nada, deja que seed lo cree
  if (!data) return null;

  //  caso 1: ya es objeto -> ok
  if (data && typeof data === "object" && !Array.isArray(data)) return data;

  //  caso 2: es array -> migrar a mapa
  if (Array.isArray(data)) {
    const map = {};
    for (const t of data) {
      if (!t || typeof t !== "object") continue;
      const id = t.teacherId || ("T" + Math.random().toString(36).slice(2,6).toUpperCase());
      map[id] = { ...t, teacherId: id };
    }
    write(TEACHERS_KEY, map);
    return map;
  }

  // fallback raro → dejar objeto vacío
  write(TEACHERS_KEY, {});
  return {};
}

// --- seed inicial + autocorrección
function seedIfEmpty() {
  let tmap = getTeachersMap();
  if (!tmap || Object.keys(tmap).length === 0) {
    tmap = {
      T001: { teacherId:"T001", email:"profe1@escuela.com", name:"Profe Ana",  password:"123456", role:"teacher" },
      T002: { teacherId:"T002", email:"profe2@escuela.com", name:"Profe Luis", password:"123456", role:"teacher" },
    };
    write(TEACHERS_KEY, tmap);
  }
  const admin = readRaw(ADMIN_KEY);
  if (!admin) {
    write(ADMIN_KEY, { email:"admin@estrellita.com", password:"admin123", name:"Administrador/a" });
  }
}
seedIfEmpty();

// =========== ADMIN ===========
export function validateAdminLogin(email, password) {
  const a = readRaw(ADMIN_KEY) || {};
  const ok = (a.email || "").toLowerCase() === String(email||"").trim().toLowerCase()
          && String(a.password) === String(password);
  return ok ? { email:a.email, name:a.name || "Admin", role:"admin" } : null;
}

// ========== DOCENTES =========
export function listTeachers() {
  const map = getTeachersMap() || {};
  return Object.values(map);
}

export function getTeacher(teacherId) {
  const map = getTeachersMap() || {};
  return map[teacherId] || null;
}

export function getTeacherByEmail(email) {
  const map = getTeachersMap() || {};
  const e = String(email || "").trim().toLowerCase();
  return Object.values(map).find(t => (t.email || "").toLowerCase() === e) || null;
}

export function validateTeacherLogin(email, password) {
  const t = getTeacherByEmail(email);
  if (!t) return null;
  return String(t.password) === String(password) ? { ...t, role: t.role || "teacher" } : null;
}

// ✔ Un único validador para Docente O Admin
export function validateTeacherOrAdmin(email, password) {
  const admin = validateAdminLogin(email, password);
  if (admin) return admin;
  const teacher = validateTeacherLogin(email, password);
  if (teacher) return teacher;
  return null;
}

// ---- CRUD docentes
export function addTeacher({ teacherId, email, name, password="123456", role="teacher" }) {
  const map = getTeachersMap() || {};
  if (!teacherId) teacherId = "T" + Math.random().toString(36).slice(2, 6).toUpperCase();
  if (map[teacherId]) throw new Error("teacherId ya existe");
  if (getTeacherByEmail(email)) throw new Error("Ya existe un docente con ese email");

  const t = {
    teacherId,
    email: String(email || "").trim().toLowerCase(),
    name: String(name || email),
    password: String(password),
    role,
  };
  map[teacherId] = t;
  write(TEACHERS_KEY, map);
  return t;
}

export function updateTeacher(teacherId, patch = {}) {
  const map = getTeachersMap() || {};
  if (!map[teacherId]) throw new Error("Docente no encontrado");

  // si cambia email, verificar duplicado EXCLUYENDO el mismo teacherId
  if (patch.email && patch.email !== map[teacherId].email) {
    const dup = Object.values(map).find(
      (t) => t.teacherId !== teacherId && (t.email || "").toLowerCase() === String(patch.email).trim().toLowerCase()
    );
    if (dup) throw new Error("Ya existe un docente con ese email");
  }

  map[teacherId] = { ...map[teacherId], ...patch };
  write(TEACHERS_KEY, map);
  return map[teacherId];
}

export function removeTeacher(teacherId) {
  const map = getTeachersMap() || {};
  if (!map[teacherId]) return false;
  delete map[teacherId];
  write(TEACHERS_KEY, map);
  return true;
}

export function resetTeachers() {
  localStorage.removeItem(TEACHERS_KEY);
  localStorage.removeItem(ADMIN_KEY);
  seedIfEmpty();
}
