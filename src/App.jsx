// src/App.jsx
import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { getStudentSession } from "./services/studentAuth.js";

import PrivateStudentRoute from "./components/PrivateStudentRoute.jsx";
import RequireRole from "./components/RequireRole.jsx";

import StudentHome from "./pages/StudentHome.jsx";
import LetterPage from "./pages/LetterPage.jsx";
import SyllablesPage from "./pages/SyllablesPage.jsx";
import SentencesPage from "./pages/SentencesPage.jsx";
import Teacher from "./pages/Teacher.jsx";
import LoginStudent from "./pages/LoginStudent.jsx";
import LoginTeacher from "./pages/LoginTeacher.jsx";
import Roster from "./pages/teacher/Roster";
import StudentReport from "./pages/teacher/StudentReport.jsx";
import StudentCodeCard from "./pages/teacher/StudentCodeCard.jsx";
import TeacherProfile from "./pages/teacher/TeacherProfile.jsx";
import Admin from "./pages/admin/Admin.jsx";

function Home() {
  return (
    <div className="container">
      <h1>🌟 Bienvenido a Estrellita Digital 🌟</h1>
      <p>Aprendiendo a leer con el método Estrellita</p>
      <div className="buttons">
        <Link to="/login-estudiante" className="btn btn-student">👧👦 Soy Estudiante</Link>
        <Link to="/login-docente" className="btn btn-teacher">👩‍🏫 Soy Docente</Link>
      </div>
    </div>
  );
}

function PrivateAdmin({ children }) {
  const { loading, role, teacher } = useAuth();
  if (loading) {
    return <div className="container" style={{ padding: 24, textAlign: "center" }}>Cargando…</div>;
  }
  const isAdmin = role === "teacher" && !!teacher?.is_admin;
  return isAdmin ? children : <Navigate to="/login-docente" replace />;
}

export default function App() {
  const { role, loading } = useAuth();
  const studentSession = getStudentSession();

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* === LOGIN ESTUDIANTE === */}
      <Route
        path="/login-estudiante"
        element={ studentSession ? <Navigate to="/estudiante" replace /> : <LoginStudent /> }
      />
      {/* Alias para QR que use /login-student */}
      <Route
        path="/login-student"
        element={ studentSession ? <Navigate to="/estudiante" replace /> : <LoginStudent /> }
      />

      {/* === LOGIN DOCENTE === */}
      <Route
        path="/login-docente"
        element={
          loading
            ? <LoginTeacher />
            : role === "teacher"
              ? <Navigate to="/docente" replace />
              : <LoginTeacher />
        }
      />

      {/* === ESTUDIANTE (con guard) === */}
      <Route
        path="/estudiante"
        element={
          <PrivateStudentRoute>
            <StudentHome />
          </PrivateStudentRoute>
        }
      />
      <Route
        path="/estudiante/letras/:id"
        element={
          <PrivateStudentRoute>
            <LetterPage />
          </PrivateStudentRoute>
        }
      />
      <Route
        path="/estudiante/silabas/:id"
        element={
          <PrivateStudentRoute>
            <SyllablesPage />
          </PrivateStudentRoute>
        }
      />
      <Route path="/estudiante/oraciones" element={<Navigate to="/estudiante/oraciones/m" replace />} />
      <Route
        path="/estudiante/oraciones/:id"
        element={
          <PrivateStudentRoute>
            <SentencesPage />
          </PrivateStudentRoute>
        }
      />

      {/* === DOCENTE === */}
      <Route element={<RequireRole allow={['teacher']} />}>
        <Route path="/docente" element={<Teacher />} />
        <Route path="/docente/roster" element={<Roster />} />
        <Route path="/docente/alumno/:uid" element={<StudentReport />} />
        <Route path="/docente/codigo/:uid" element={<StudentCodeCard />} />
        <Route path="/docente/perfil" element={<TeacherProfile />} />
      </Route>

      {/* === ADMIN === */}
      <Route path="/admin" element={<PrivateAdmin><Admin /></PrivateAdmin>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
