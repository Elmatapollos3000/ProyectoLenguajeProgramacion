import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Tabla from "../../components/Tabla";
import api from "../../services/api";

const COLUMNAS_LOTES = [
  { label: "Insumo", key: "nombre" },
  { label: "Cantidad", key: "cantidad_actual" },
  {
    label: "Vencimiento",
    key: "fecha_vencimiento",
    render: (val) => {
      if (!val) return "—";
      const dias = Math.ceil(
        (new Date(val) - new Date()) / (1000 * 60 * 60 * 24),
      );
      if (dias <= 3)
        return (
          <span className="text-danger fw-semibold">
            {new Date(val).toLocaleDateString("es-PE")}
            <span className="ms-1 small">({dias}d)</span>
          </span>
        );
      return new Date(val).toLocaleDateString("es-PE");
    },
  },
  {
    label: "Estado",
    key: "estado",
    render: (val) => {
      const cfg = {
        activo: "success",
        vencido: "danger",
        consumido: "secondary",
      };
      return (
        <span className={`badge bg-${cfg[val] ?? "secondary"}`}>{val}</span>
      );
    },
  },
];

const COLUMNAS_MOVIMIENTOS = [
  { label: "Insumo", key: "nombre" },
  {
    label: "Tipo",
    key: "tipo",
    render: (val) => {
      const cfg = {
        salida: "secondary",
        merma: "danger",
        apertura: "info",
        preparacion: "warning",
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

export default function AsistenteDashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const [resumen, setResumen] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resRep, resLotes, resMov] = await Promise.all([
        api.get("/reportes"),
        api.get("/lotes"),
        api.get("/movimientos"),
      ]);
      setResumen(resRep.data);
      setLotes(resLotes.data.filter((l) => l.estado === "activo").slice(0, 8));
      setMovimientos(resMov.data.slice(0, 8));
    } catch {
      console.error("Error al cargar dashboard asistente");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <Layout titulo="Dashboard Asistente">
      <div className="mb-4">
        <h5 className="fw-bold mb-0">Bienvenido, {usuario.nombres} 👋</h5>
        <p className="text-muted small mb-0">
          Control de inventario y movimientos
        </p>
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
              titulo="Lotes activos"
              valor={resumen?.activos ?? 0}
              icono="bi bi-layers"
              variante="success"
            />
          </div>
          <div className="col-6 col-md-3">
            <Card
              titulo="Vencidos"
              valor={resumen?.vencidos ?? 0}
              icono="bi bi-x-circle"
              variante="danger"
            />
          </div>
          <div className="col-6 col-md-3">
            <Card
              titulo="Stock total"
              valor={resumen?.stock_total ?? 0}
              icono="bi bi-box-seam"
              variante="primary"
              subtitulo="unidades"
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
        </div>
      )}

      <div className="row g-4">
        {/* Lotes activos recientes */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold small">
                <i className="bi bi-layers text-success me-2" />
                Lotes activos recientes
              </span>
              <button
                className="btn btn-link btn-sm p-0 text-decoration-none"
                onClick={() => navigate("/lotes")}
              >
                Ver todos <i className="bi bi-arrow-right" />
              </button>
            </div>
            <div className="card-body p-0">
              <Tabla
                columnas={COLUMNAS_LOTES}
                datos={lotes}
                cargando={cargando}
                mensajeVacio="Sin lotes activos."
              />
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">
          {/* Últimos movimientos */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold small">
                <i className="bi bi-arrow-left-right text-primary me-2" />
                Últimos movimientos
              </span>
              <button
                className="btn btn-link btn-sm p-0 text-decoration-none"
                onClick={() => navigate("/movimientos")}
              >
                Ver todos <i className="bi bi-arrow-right" />
              </button>
            </div>
            <div className="card-body p-0">
              <Tabla
                columnas={COLUMNAS_MOVIMIENTOS}
                datos={movimientos}
                cargando={cargando}
                mensajeVacio="Sin movimientos."
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
                  label: "Nuevo lote",
                  icono: "bi bi-plus-circle",
                  ruta: "/lotes",
                  color: "outline-primary",
                },
                {
                  label: "Registrar movimiento",
                  icono: "bi bi-arrow-left-right",
                  ruta: "/movimientos",
                  color: "outline-secondary",
                },
                {
                  label: "Ver insumos",
                  icono: "bi bi-box-seam",
                  ruta: "/insumos",
                  color: "outline-secondary",
                },
                {
                  label: "Ver reportes",
                  icono: "bi bi-bar-chart",
                  ruta: "/reportes",
                  color: "outline-dark",
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
