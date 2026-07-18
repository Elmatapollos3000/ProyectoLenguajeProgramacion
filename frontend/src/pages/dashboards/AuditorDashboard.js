import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Tabla from "../../components/Tabla";
import api from "../../services/api";

const COLUMNAS_AUDITORIA = [
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
    render: (val) => {
      const cfg = {
        INSERT: "success",
        UPDATE: "warning",
        DELETE: "danger",
        LOGIN: "primary",
      };
      return (
        <span
          className={`badge bg-${cfg[val] ?? "secondary"} text-${cfg[val] === "UPDATE" ? "dark" : "white"}`}
        >
          {val}
        </span>
      );
    },
  },
  {
    label: "Usuario",
    key: "usuario",
    render: (val) =>
      val === "Sistema" ? (
        <span className="text-muted fst-italic small">Sistema</span>
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
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
  },
];

const COLUMNAS_MOVIMIENTOS = [
  { label: "Insumo", key: "nombre" },
  {
    label: "Tipo",
    key: "tipo",
    render: (val) => {
      const cfg = {
        merma: "danger",
        salida: "secondary",
        preparacion: "warning",
        apertura: "info",
        ingreso: "primary",
      };
      return (
        <span className={`badge bg-${cfg[val] ?? "secondary"}`}>{val}</span>
      );
    },
  },
  { label: "Cantidad", key: "cantidad" },
  {
    label: "Fecha",
    key: "fecha",
    render: (val) =>
      val
        ? new Date(val).toLocaleString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
  },
];

export default function AuditorDashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const [auditoria, setAuditoria] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resAud, resMov, resRep] = await Promise.all([
        api.get("/auditoria"),
        api.get("/movimientos"),
        api.get("/reportes"),
      ]);
      setAuditoria(resAud.data.slice(0, 8));
      setMovimientos(resMov.data.filter((m) => m.tipo === "merma").slice(0, 6));
      setResumen(resRep.data);
    } catch {
      console.error("Error al cargar dashboard auditor");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Conteos auditoría
  //const conteoAud = (accion) =>
  //auditoria.filter((a) => a.accion === accion).length;

  return (
    <Layout titulo="Dashboard Auditor">
      <div className="mb-4">
        <h5 className="fw-bold mb-0">Bienvenido, {usuario.nombres} 👋</h5>
        <p className="text-muted small mb-0">Panel de auditoría y control</p>
      </div>

      {/* Cards */}
      {cargando ? (
        <div className="text-center py-4">
          <div className="spinner-border text-danger" role="status" />
        </div>
      ) : (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <Card
              titulo="Lotes vencidos"
              valor={resumen?.vencidos ?? 0}
              icono="bi bi-x-circle"
              variante="danger"
            />
          </div>
          <div className="col-6 col-md-3">
            <Card
              titulo="Próx. a vencer"
              valor={resumen?.proximos_a_vencer ?? 0}
              icono="bi bi-clock-history"
              variante="warning"
              subtitulo="en 3 días"
            />
          </div>
          <div className="col-6 col-md-3">
            <Card
              titulo="Eventos recientes"
              valor={auditoria.length}
              icono="bi bi-journal-text"
              variante="primary"
              subtitulo="últimos registros"
            />
          </div>
          <div className="col-6 col-md-3">
            <Card
              titulo="Mermas recientes"
              valor={movimientos.length}
              icono="bi bi-exclamation-triangle"
              variante="secondary"
            />
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Últimos eventos de auditoría */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold small">
                <i className="bi bi-journal-text text-primary me-2" />
                Últimos eventos
              </span>
              <button
                className="btn btn-link btn-sm p-0 text-decoration-none"
                onClick={() => navigate("/auditoria")}
              >
                Ver todos <i className="bi bi-arrow-right" />
              </button>
            </div>
            <div className="card-body p-0">
              <Tabla
                columnas={COLUMNAS_AUDITORIA}
                datos={auditoria}
                cargando={cargando}
                mensajeVacio="Sin eventos de auditoría."
              />
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">
          {/* Mermas recientes */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold small">
                <i className="bi bi-exclamation-triangle text-warning me-2" />
                Mermas recientes
              </span>
              <button
                className="btn btn-link btn-sm p-0 text-decoration-none"
                onClick={() => navigate("/movimientos")}
              >
                Ver todas <i className="bi bi-arrow-right" />
              </button>
            </div>
            <div className="card-body p-0">
              <Tabla
                columnas={COLUMNAS_MOVIMIENTOS}
                datos={movimientos}
                cargando={cargando}
                mensajeVacio="Sin mermas recientes."
              />
            </div>
          </div>

          {/* Accesos rápidos */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-2">
              <span className="fw-semibold small">
                <i className="bi bi-lightning-charge text-warning me-2" />
                Accesos rápidos
              </span>
            </div>
            <div className="card-body d-flex flex-column gap-2">
              {[
                {
                  label: "Auditoría completa",
                  icono: "bi bi-journal-text",
                  ruta: "/auditoria",
                  color: "outline-primary",
                },
                {
                  label: "Ver reportes",
                  icono: "bi bi-bar-chart",
                  ruta: "/reportes",
                  color: "outline-dark",
                },
                {
                  label: "Ver movimientos",
                  icono: "bi bi-arrow-left-right",
                  ruta: "/movimientos",
                  color: "outline-secondary",
                },
              ].map((item) => (
                <button
                  key={item.ruta}
                  className={`btn btn-${item.color} btn-sm text-start d-flex align-items-center gap-2`}
                  onClick={() => navigate(item.ruta)}
                >
                  <i className={item.icono} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
