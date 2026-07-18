import { useNavigate } from "react-router-dom";

// Navbar superior — muestra saludo y botón de cerrar sesión
// Se usa junto al Sidebar en el layout principal
export default function Navbar({ titulo = "Panel" }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <nav
      className="navbar border-bottom px-4 bg-white"
      style={{ height: "60px" }}
    >
      {/* Título de la sección actual */}
      <span className="navbar-brand mb-0 fw-semibold fs-6">{titulo}</span>

      {/* Lado derecho: saludo + cerrar sesión */}
      <div className="d-flex align-items-center gap-3">
        <span className="text-muted small d-none d-md-inline">
          Hola, <strong>{usuario.nombres}</strong>
        </span>

        <button
          onClick={cerrarSesion}
          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
        >
          <i className="bi bi-box-arrow-right" />
          <span className="d-none d-md-inline">Salir</span>
        </button>
      </div>
    </nav>
  );
}
