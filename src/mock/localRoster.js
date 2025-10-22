
// src/mock/localRoster.js


// Estructura en localStorage:
// STUDENTS_KEY: { [uid]: Student }
// ROSTERS_KEY : { [classId]: [uid, ...] }
// CODE_INDEX  : { [studentCode]: uid }  ← índice GLOBAL por código (sin clase)

const STUDENTS_KEY = "estrellita_students";
const ROSTERS_KEY  = "estrellita_rosters";
const CODE_INDEX   = "estrellita_studentCodes";

// --- helpers base ---
function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); }
  catch { return {}; }
}
function write(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

// --- helpers extendidos para formato lista/mapa ---
// Lee el valor crudo del storage (mapa o arreglo)
function readRaw() {
  try { return JSON.parse(localStorage.getItem(STUDENTS_KEY) || "{}"); }
  catch { return {}; }
}

// Guarda el mapa crudo
function writeRaw(map) {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(map || {}));
}

// Normaliza a LISTA de alumnos
function readList() {
  const raw = readRaw();
  if (Array.isArray(raw)) return raw;
  return Object.values(raw || {});
}

// Convierte lista a mapa y guarda
function writeList(list) {
  const map = {};
  for (const s of list || []) {
    if (s && s.uid) map[s.uid] = s;
  }
  writeRaw(map);
}

// ===== Generar código de alumno legible =====
// Formato: AAA-12345  (sin I/O y sin 0/1 para evitar confundir)
function genStudentCode() {
  const ABC  = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin I, O
  const NUM  = "23456789";                 // sin 0,1
  const pick = (s,n)=> Array.from({length:n},()=>s[Math.floor(Math.random()*s.length)]).join("");

  const codes = read(CODE_INDEX);
  for (let i=0; i<100; i++){
    const candidate = `${pick(ABC,3)}-${pick(NUM,5)}`; // ej: RQZ-48267
    if (!codes[candidate]) return candidate;
  }
  return `STU-${Date.now().toString(36).toUpperCase()}`;
}

// === Alta rápida por login estudiante (si ya la usas en otro flujo) ===
export function addStudentToRoster({ uid, classId, teacherId, status = "active" }) {
  const students = read(STUDENTS_KEY);
  const rosters  = read(ROSTERS_KEY);

  students[uid] = {
    ...(students[uid] || {}),
    uid, classId, teacherId,
    status,
    joinedAt: students[uid]?.joinedAt || Date.now(),
  };

  const list = new Set(rosters[classId] || []);
  list.add(uid);
  rosters[classId] = Array.from(list);

  write(STUDENTS_KEY, students);
  write(ROSTERS_KEY, rosters);
  return students[uid];
}

// === Crear alumno manualmente  con CÓDIGO ÚNICO GLOBAL ===
export function createStudentManual({
  displayName, grade, section, classId, teacherId,
  dob = null, guardianName = "", guardianPhone = "", guardianEmail = "",
  consentAudio = true, notes = "", specialNeeds = "", studentCode
}) {
  if (!displayName || !grade || !section || !classId || !teacherId) {
    throw new Error("Faltan campos obligatorios (nombre, grado, sección).");
  }

  const students = read(STUDENTS_KEY);
  const rosters  = read(ROSTERS_KEY);
  const codes    = read(CODE_INDEX);

  const code = (studentCode || genStudentCode()).toUpperCase().trim();
  if (codes[code]) throw new Error("El código de alumno ya existe.");

  const uid = crypto.randomUUID();
  const now = Date.now();

  const student = {
    uid,
    displayName: String(displayName).trim(),
    grade: String(grade).trim(),
    section: String(section).trim(),
    classId,
    teacherId,
    studentCode: code,
    dob, guardianName, guardianPhone, guardianEmail,
    consentAudio: !!consentAudio,
    notes, specialNeeds,
    status: "active",
    joinedAt: now,
    updatedAt: now,
    hasAccount: false
  };

  students[uid] = student;

  const list = new Set(rosters[classId] || []);
  list.add(uid);
  rosters[classId] = Array.from(list);

  codes[code] = uid;

  write(STUDENTS_KEY, students);
  write(ROSTERS_KEY, rosters);
  write(CODE_INDEX, codes);
  return student;
}

// Buscar alumno por código global
export function getStudentByCode(studentCode) {
  const codes = read(CODE_INDEX);
  const students = read(STUDENTS_KEY);
  const uid = codes[(studentCode || "").toUpperCase().trim()];
  return uid ? students[uid] || null : null;
}

// Regenerar código de alumno
export function regenerateStudentCode(uid) {
  const students = read(STUDENTS_KEY);
  const codes    = read(CODE_INDEX);
  const s = students[uid];
  if (!s) throw new Error("Alumno no encontrado");

  if (s.studentCode && codes[s.studentCode]) {
    delete codes[s.studentCode];
  }

  const newCode = genStudentCode();
  s.studentCode = newCode;
  s.updatedAt = Date.now();

  codes[newCode] = uid;
  write(STUDENTS_KEY, students);
  write(CODE_INDEX, codes);
  return newCode;
}

// Marcar como reclamado (primer login del estudiante)
export function claimStudent(uid, displayNameIfEmpty) {
  const students = read(STUDENTS_KEY);
  if (!students[uid]) return false;
  students[uid].hasAccount = true;
  if (!students[uid].displayName && displayNameIfEmpty) {
    students[uid].displayName = displayNameIfEmpty;
  }
  students[uid].updatedAt = Date.now();
  write(STUDENTS_KEY, students);
  return true;
}

// === Actualizaciones ===
export function updateStudent(uid, patch) {
  const students = read(STUDENTS_KEY);
  if (!students[uid]) throw new Error("Alumno no encontrado");
  students[uid] = { ...students[uid], ...patch, updatedAt: Date.now() };
  write(STUDENTS_KEY, students);
  return students[uid];
}

export function updateStudentStatus(uid, status) {
  const students = read(STUDENTS_KEY);
  if (!students[uid]) return false;
  students[uid].status = status;
  students[uid].updatedAt = Date.now();
  write(STUDENTS_KEY, students);
  return true;
}

export function removeStudent(uid) {
  const students = read(STUDENTS_KEY);
  const rosters  = read(ROSTERS_KEY);
  const codes    = read(CODE_INDEX);
  const s = students[uid];
  if (!s) return false;

  if (s.studentCode && codes[s.studentCode]) {
    delete codes[s.studentCode];
  }

  const list = new Set(rosters[s.classId] || []);
  list.delete(uid);
  rosters[s.classId] = Array.from(list);

  delete students[uid];
  write(STUDENTS_KEY, students);
  write(ROSTERS_KEY, rosters);
  write(CODE_INDEX, codes);
  return true;
}

// === Lecturas ===
export function getStudentsByTeacher(teacherId) {
  const students = read(STUDENTS_KEY);
  return Object.values(students).filter(s => s.teacherId === teacherId);
}

export function getStudentsByClass(classId) {
  const students = read(STUDENTS_KEY);
  const rosters  = read(ROSTERS_KEY);
  const ids = rosters[classId] || [];
  return ids.map(uid => students[uid]).filter(Boolean);
}

export function getStudentStatus(uid) {
  const students = read(STUDENTS_KEY);
  return students[uid]?.status || null;
}

// === FUNCIÓN EDITAR  ===
export function updateStudentInfo(uid, updates = {}) {
  const list = readList();
  const idx = list.findIndex(s => s.uid === uid);
  if (idx === -1) throw new Error("Alumno no encontrado");

  list[idx] = { ...list[idx], ...updates, updatedAt: Date.now() };
  writeList(list);
  return list[idx];
}
