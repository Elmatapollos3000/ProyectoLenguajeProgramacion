import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

// Mapa de rol → ruta del dashboard
const RUTAS_POR_ROL = {
  Administrador: "/admin",
  Asistente: "/asistente",
  Cocinero: "/cocinero",
  Auditor: "/auditor",
};

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim() || !form.password.trim()) {
      setError("Completa usuario y contraseña.");
      return;
    }

    setCargando(true);

    try {
      // POST /api/login → devuelve { id_usuario, username, rol, nombres, apellidos }
      const { data } = await api.post("/login", form);

      // Guardar sesión para usar en dashboards
      localStorage.setItem("usuario", JSON.stringify(data));

      const ruta = RUTAS_POR_ROL[data.rol];

      if (ruta) {
        navigate(ruta);
      } else {
        setError(`Rol desconocido: "${data.rol}". Contacta al administrador.`);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Usuario o contraseña incorrectos.");
      } else {
        setError("Error de conexión. Intenta de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    // Fondo gris claro, centra la card vertical y horizontal
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div
        className="card shadow-sm border-0 p-4"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        {/* Encabezado */}
        <div className="text-center mb-4">
          <img
            src="/logo.png"
            alt="KFC"
            style={{ height: "56px", objectFit: "contain" }}
            className="mb-3"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <h4 className="fw-bold mb-1">Inventario KFC</h4>
          <p className="text-muted small mb-0">Inicia sesión para continuar</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Usuario */}
          <div className="mb-3">
            <label htmlFor="username" className="form-label fw-semibold">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-control"
              autoComplete="username"
              placeholder="Tu nombre de usuario"
              value={form.username}
              onChange={handleChange}
              disabled={cargando}
            />
          </div>

          {/* Contraseña */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={form.password}
              onChange={handleChange}
              disabled={cargando}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            className="btn w-100 fw-semibold text-white"
            style={{ backgroundColor: "#e4002b" }}
            disabled={cargando}
          >
            {cargando ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
