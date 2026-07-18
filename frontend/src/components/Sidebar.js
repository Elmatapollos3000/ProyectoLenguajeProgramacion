import { NavLink, useNavigate } from "react-router-dom";

// Menú por rol — agrega o quita items según crezca el proyecto
const MENU_POR_ROL = {
  Administrador: [
    { path: "/admin", icono: "bi bi-speedometer2", label: "Dashboard" },
    { path: "/insumos", icono: "bi bi-box-seam", label: "Insumos" },
    { path: "/lotes", icono: "bi bi-layers", label: "Lotes" },
    {
      path: "/movimientos",
      icono: "bi bi-arrow-left-right",
      label: "Movimientos",
    },
    { path: "/empleados", icono: "bi bi-people", label: "Empleados" },
    { path: "/usuarios", icono: "bi bi-person-badge", label: "Usuarios" },
    { path: "/roles", icono: "bi bi-shield-check", label: "Roles" },
    { path: "/auditoria", icono: "bi bi-journal-text", label: "Auditoría" },
    { path: "/reportes", icono: "bi bi-bar-chart", label: "Reportes" },
  ],
  Asistente: [
    { path: "/asistente", icono: "bi bi-speedometer2", label: "Dashboard" },
    { path: "/insumos", icono: "bi bi-box-seam", label: "Insumos" },
    { path: "/lotes", icono: "bi bi-layers", label: "Lotes" },
    {
      path: "/movimientos",
      icono: "bi bi-arrow-left-right",
      label: "Movimientos",
    },
    { path: "/reportes", icono: "bi bi-bar-chart", label: "Reportes" },
  ],
  Cocinero: [
    { path: "/cocinero", icono: "bi bi-speedometer2", label: "Dashboard" },
    { path: "/preparacion", icono: "bi bi-fire", label: "Preparación" },
    { path: "/lotes", icono: "bi bi-layers", label: "Lotes" },
  ],
  Auditor: [
    { path: "/auditor", icono: "bi bi-speedometer2", label: "Dashboard" },
    { path: "/auditoria", icono: "bi bi-journal-text", label: "Auditoría" },
    { path: "/reportes", icono: "bi bi-bar-chart", label: "Reportes" },
    {
      path: "/movimientos",
      icono: "bi bi-arrow-left-right",
      label: "Movimientos",
    },
  ],
};

export default function Sidebar() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const menu = MENU_POR_ROL[usuario.rol] || [];

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <div
      className="d-flex flex-column bg-dark text-white"
      style={{ width: "240px", minHeight: "100vh", position: "sticky", top: 0 }}
    >
      {/* Logo / nombre sistema */}
      <div className="text-center py-4 border-bottom border-secondary">
        <img
          src="/logo.png"
          alt="KFC"
          style={{ height: "44px", objectFit: "contain" }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <p className="mb-0 mt-2 small fw-semibold text-white-50">
          Inventario KFC
        </p>
      </div>

      {/* Info del usuario */}
      <div className="px-3 py-3 border-bottom border-secondary">
        <p className="mb-0 fw-semibold" style={{ fontSize: "0.875rem" }}>
          {usuario.nombres} {usuario.apellidos}
        </p>
        <span
          className="badge mt-1"
          style={{ backgroundColor: "#e4002b", fontSize: "0.7rem" }}
        >
          {usuario.rol}
        </span>
      </div>

      {/* Links de navegación */}
      <nav className="flex-grow-1 py-2">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `d-flex align-items-center gap-2 px-3 py-2 text-decoration-none
               ${isActive ? "text-white fw-semibold" : "text-white-50"}`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? "#e4002b" : "transparent",
              borderRadius: "6px",
              margin: "2px 8px",
              fontSize: "0.9rem",
              transition: "background-color 0.15s",
            })}
          >
            <i className={item.icono} style={{ fontSize: "1rem" }} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-3 border-top border-secondary">
        <button
          onClick={cerrarSesion}
          className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
        >
          <i className="bi bi-box-arrow-left" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
