import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Tabla from "../components/Tabla";
import api from "../services/api";

// Badge por acción
const BadgeAccion = ({ accion }) => {
  const config = {
    INSERT: { bg: "success", label: "Creación" },
    UPDATE: { bg: "warning", label: "Edición" },
    DELETE: { bg: "danger", label: "Eliminación" },
    LOGIN: { bg: "primary", label: "Login" },
  };
  const c = config[accion] ?? { bg: "secondary", label: accion };
  return (
    <span
      className={`badge bg-${c.bg} text-${c.bg === "warning" ? "dark" : "white"}`}
    >
      {c.label}
    </span>
  );
};

const COLUMNAS = [
  { label: "ID", key: "id_auditoria" },
  {
    label: "Tabla",
    key: "tabla",
    render: (val) => (
      <span className="badge bg-light text-dark border">{val}</span>
    ),
  },
  {
    label: "Acción",
    key: "accion",
    render: (val) => <BadgeAccion accion={val} />,
  },
  { label: "ID Reg.", key: "id_registro" },
  {
    label: "Usuario",
    key: "usuario",
    render: (val) =>
      val === "Sistema" ? (
        <span className="text-muted small fst-italic">Sistema</span>
      ) : (
        <strong>{val}</strong>
      ),
  },
  {
    label: "Fecha",
    key: "fecha",
    render: (val) =>
      val
        ? new Date(val).toLocaleString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
  },
  {
    label: "Cambios",
    key: "cambios",
    render: (val) =>
      val ? (
        <span
          title={val}
          style={{
            maxWidth: "220px",
            display: "inline-block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "0.8rem",
            color: "#6b7280",
          }}
        >
          {val}
        </span>
      ) : (
        "—"
      ),
  },
];

// Tablas únicas para el filtro
const obtenerTablas = (registros) =>
  [...new Set(registros.map((r) => r.tabla))].sort();

export default function Auditoria() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [filtroAccion, setFiltroAccion] = useState("todos");
  const [filtroTabla, setFiltroTabla] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  // ── Cargar auditoría ─────────────────────────────────────
  const cargarAuditoria = async () => {
    setCargando(true);
    try {
      const { data } = await api.get("/auditoria");
      setRegistros(data);
    } catch {
      setError("Error al cargar la auditoría.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAuditoria();
  }, []);

  // ── Filtrar registros ────────────────────────────────────
  const registrosFiltrados = registros.filter((r) => {
    const coincideAccion =
      filtroAccion === "todos" || r.accion === filtroAccion;
    const coincideTabla = filtroTabla === "todas" || r.tabla === filtroTabla;
    const coincideBusqueda =
      busqueda === "" ||
      r.usuario?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.cambios?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.tabla?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideAccion && coincideTabla && coincideBusqueda;
  });

  // ── Contadores ───────────────────────────────────────────
  const conteo = (accion) =>
    registros.filter((r) => r.accion === accion).length;

  const tablas = obtenerTablas(registros);

  return (
    <Layout titulo="Auditoría">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="fw-bold mb-0">Auditoría</h5>
          <p className="text-muted small mb-0">
            Historial de cambios en el sistema
          </p>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
          onClick={cargarAuditoria}
          disabled={cargando}
        >
          <i className={`bi bi-arrow-clockwise ${cargando ? "spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible py-2 small"
          role="alert"
        >
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          />
        </div>
      )}

      {/* Resumen de conteos */}
      <div className="row g-2 mb-3">
        {[
          { accion: "INSERT", label: "Creaciones", bg: "success" },
          { accion: "UPDATE", label: "Ediciones", bg: "warning" },
          { accion: "DELETE", label: "Eliminaciones", bg: "danger" },
          { accion: "LOGIN", label: "Logins", bg: "primary" },
        ].map(({ accion, label, bg }) => (
          <div key={accion} className="col-6 col-md-3">
            <div
              className={`card border-0 bg-${bg} bg-opacity-10 text-center py-2`}
            >
              <p
                className="mb-0 fw-bold fs-5"
                style={{ color: `var(--bs-${bg})` }}
              >
                {conteo(accion)}
              </p>
              <p className="mb-0 small text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        {/* Filtro por acción */}
        <div className="d-flex gap-1 flex-wrap">
          {[
            { key: "todos", label: "Todas", bg: "secondary" },
            { key: "INSERT", label: "Creación", bg: "success" },
            { key: "UPDATE", label: "Edición", bg: "warning" },
            { key: "DELETE", label: "Eliminación", bg: "danger" },
            { key: "LOGIN", label: "Login", bg: "primary" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltroAccion(f.key)}
              className={`btn btn-sm ${
                filtroAccion === f.key ? `btn-${f.bg}` : `btn-outline-${f.bg}`
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtro por tabla */}
        <select
          className="form-select form-select-sm"
          style={{ width: "auto" }}
          value={filtroTabla}
          onChange={(e) => setFiltroTabla(e.target.value)}
        >
          <option value="todas">Todas las tablas</option>
          {tablas.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Buscador */}
        <div className="input-group input-group-sm" style={{ width: "220px" }}>
          <span className="input-group-text bg-white">
            <i className="bi bi-search text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Usuario o cambios..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button
              className="btn btn-outline-secondary"
              onClick={() => setBusqueda("")}
            >
              <i className="bi bi-x" />
            </button>
          )}
        </div>

        {/* Contador de resultados */}
        <span className="text-muted small ms-auto">
          {registrosFiltrados.length} de {registros.length} registros
        </span>
      </div>

      {/* Tabla */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Tabla
            columnas={COLUMNAS}
            datos={registrosFiltrados}
            cargando={cargando}
            mensajeVacio="No hay registros de auditoría."
          />
        </div>
      </div>

      {/* Estilos para animación del ícono de recarga */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { display: inline-block; animation: spin 1s linear infinite; }
      `}</style>
    </Layout>
  );
}
