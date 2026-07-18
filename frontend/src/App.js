import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth
import Login from "./pages/Login";

// Dashboards
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import AsistenteDashboard from "./pages/dashboards/AsistenteDashboard";
import CocineroDashboard from "./pages/dashboards/CocineroDashboard";
import AuditorDashboard from "./pages/dashboards/AuditorDashboard";

// Páginas
import Insumos from "./pages/Insumos";
import Lotes from "./pages/Lotes";
import Movimientos from "./pages/Movimientos";
import Preparacion from "./pages/Preparacion";
import Empleados from "./pages/Empleados";
import Usuarios from "./pages/Usuarios";
import Roles from "./pages/Roles";
import Auditoria from "./pages/Auditoria";
import Reportes from "./pages/Reportes";

// ============================================================
// Ruta protegida: redirige al login si no hay sesión activa
// ============================================================
function RutaProtegida({ children, rolesPermitidos }) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  // Sin sesión → al login
  if (!usuario) return <Navigate to="/" replace />;

  // Si la ruta requiere roles específicos, verificar
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to={rutaPorRol(usuario.rol)} replace />;
  }

  return children;
}

// Devuelve la ruta del dashboard según el rol
function rutaPorRol(rol) {
  const rutas = {
    Administrador: "/admin",
    Asistente: "/asistente",
    Cocinero: "/cocinero",
    Auditor: "/auditor",
  };
  return rutas[rol] ?? "/";
}

// ============================================================
// Ruta del login: si ya hay sesión redirige al dashboard
// ============================================================
function RutaLogin() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  if (usuario) return <Navigate to={rutaPorRol(usuario.rol)} replace />;
  return <Login />;
}

// ============================================================
// App principal
// ============================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Login ── */}
        <Route path="/" element={<RutaLogin />} />

        {/* ── Dashboards (cada rol solo puede ver el suyo) ── */}
        <Route
          path="/admin"
          element={
            <RutaProtegida rolesPermitidos={["Administrador"]}>
              <AdminDashboard />
            </RutaProtegida>
          }
        />

        <Route
          path="/asistente"
          element={
            <RutaProtegida rolesPermitidos={["Asistente"]}>
              <AsistenteDashboard />
            </RutaProtegida>
          }
        />

        <Route
          path="/cocinero"
          element={
            <RutaProtegida rolesPermitidos={["Cocinero"]}>
              <CocineroDashboard />
            </RutaProtegida>
          }
        />

        <Route
          path="/auditor"
          element={
            <RutaProtegida rolesPermitidos={["Auditor"]}>
              <AuditorDashboard />
            </RutaProtegida>
          }
        />

        {/* ── Páginas compartidas ──
            rolesPermitidos vacío = cualquier usuario autenticado puede acceder
            Puedes agregar restricciones según tu lógica de negocio           */}

        {/* Solo Admin y Asistente gestionan insumos y lotes */}
        <Route
          path="/insumos"
          element={
            <RutaProtegida rolesPermitidos={["Administrador", "Asistente"]}>
              <Insumos />
            </RutaProtegida>
          }
        />

        <Route
          path="/lotes"
          element={
            <RutaProtegida
              rolesPermitidos={["Administrador", "Asistente", "Cocinero"]}
            >
              <Lotes />
            </RutaProtegida>
          }
        />

        {/* Movimientos: Admin, Asistente y Auditor */}
        <Route
          path="/movimientos"
          element={
            <RutaProtegida
              rolesPermitidos={["Administrador", "Asistente", "Auditor"]}
            >
              <Movimientos />
            </RutaProtegida>
          }
        />

        {/* Preparación: solo Cocinero (y Admin para supervisar) */}
        <Route
          path="/preparacion"
          element={
            <RutaProtegida rolesPermitidos={["Cocinero", "Administrador"]}>
              <Preparacion />
            </RutaProtegida>
          }
        />

        {/* Gestión de personal: solo Admin */}
        <Route
          path="/empleados"
          element={
            <RutaProtegida rolesPermitidos={["Administrador"]}>
              <Empleados />
            </RutaProtegida>
          }
        />

        <Route
          path="/usuarios"
          element={
            <RutaProtegida rolesPermitidos={["Administrador"]}>
              <Usuarios />
            </RutaProtegida>
          }
        />

        <Route
          path="/roles"
          element={
            <RutaProtegida rolesPermitidos={["Administrador"]}>
              <Roles />
            </RutaProtegida>
          }
        />

        {/* Auditoría: Admin y Auditor */}
        <Route
          path="/auditoria"
          element={
            <RutaProtegida rolesPermitidos={["Administrador", "Auditor"]}>
              <Auditoria />
            </RutaProtegida>
          }
        />

        {/* Reportes: Admin, Asistente y Auditor */}
        <Route
          path="/reportes"
          element={
            <RutaProtegida
              rolesPermitidos={["Administrador", "Asistente", "Auditor"]}
            >
              <Reportes />
            </RutaProtegida>
          }
        />

        {/* ── Ruta 404: redirige al login o dashboard ── */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                JSON.parse(localStorage.getItem("usuario") || "null")
                  ? rutaPorRol(JSON.parse(localStorage.getItem("usuario")).rol)
                  : "/"
              }
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
