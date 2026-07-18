import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Tabla from "../../components/Tabla";
import api from "../../services/api";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLUMNAS_LOTES_CRITICOS = [
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
      return (
        <span
          className={`fw-semibold ${dias <= 1 ? "text-danger" : "text-warning"}`}
        >
          {new Date(val).toLocaleDateString("es-PE")}
          <span className="ms-1 small">({dias}d)</span>
        </span>
      );
    },
  },
  {
    label: "Estado",
    key: "estado",
    render: (val) => (
      <span
        className={`badge bg-${val === "vencido" ? "danger" : "warning"} text-${val === "vencido" ? "white" : "dark"}`}
      >
        {val}
      </span>
    ),
  },
];

const COLUMNAS_MERMAS = [
  { label: "Insumo", key: "nombre" },
  { label: "Total merma", key: "total_merma" },
  { label: "Registros", key: "cantidad_registros" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const [resumen, setResumen] = useState(null);
  const [lotesCriticos, setLotesCriticos] = useState([]);
  const [mermas, setMermas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resRep, resLotes, resMermas] = await Promise.all([
        api.get("/reportes"),
        api.get("/lotes"),
        api.get("/reportes/mermas"),
      ]);
      setResumen(resRep.data);
      // Lotes vencidos o que vencen en 3 días
      const criticos = resLotes.data.filter((l) => {
        if (l.estado === "vencido") return true;
        const dias = Math.ceil(
          (new Date(l.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24),
        );
        return dias <= 3 && l.estado === "activo";
      });
      setLotesCriticos(criticos);
      setMermas(resMermas.data);
    } catch {
      console.error("Error al cargar dashboard admin");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <Layout titulo="Dashboard Administrador">
      {/* Saludo */}
      <div className="mb-4">
        <h5 className="fw-bold mb-0">Bienvenido, {usuario.nombres} 👋</h5>
        <p className="text-muted small mb-0">
          Resumen general del sistema de inventario
        </p>
      </div>

      {/* Cards resumen */}
      {cargando ? (
        <div className="text-center py-4">
          <div className="spinner-border text-danger" role="status" />
        </div>
      ) : (
        <div className="row g-3 mb-4">
          <div className="col-6 col-xl-2">
            <Card
              titulo="Total lotes"
              valor={resumen?.total_lotes ?? 0}
              icono="bi bi-layers"
              variante="primary"
            />
          </div>
          <div className="col-6 col-xl-2">
            <Card
              titulo="Activos"
              valor={resumen?.activos ?? 0}
              icono="bi bi-check-circle"
              variante="success"
            />
          </div>
          <div className="col-6 col-xl-2">
            <Card
              titulo="Vencidos"
              valor={resumen?.vencidos ?? 0}
              icono="bi bi-x-circle"
              variante="danger"
            />
          </div>
          <div className="col-6 col-xl-2">
            <Card
              titulo="Consumidos"
              valor={resumen?.consumidos ?? 0}
              icono="bi bi-archive"
              variante="secondary"
            />
          </div>
          <div className="col-6 col-xl-2">
            <Card
              titulo="Stock total"
              valor={resumen?.stock_total ?? 0}
              icono="bi bi-box-seam"
              variante="primary"
              subtitulo="unidades"
            />
          </div>
          <div className="col-6 col-xl-2">
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

      {/* Gráfico: distribución de lotes por estado */}
      <div className="row g-4 mt-1">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-2">
              <span className="fw-semibold small">
                <i className="bi bi-pie-chart text-primary me-2" />
                Distribución de lotes por estado
              </span>
            </div>
            <div className="card-body">
              {cargando ? (
                <div className="text-center py-4">
                  <div
                    className="spinner-border spinner-border-sm text-danger"
                    role="status"
                  />
                </div>
              ) : !resumen || resumen.total_lotes === 0 ? (
                <p className="text-muted small mb-0 text-center py-4">
                  Sin lotes registrados.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Activos",
                          value: resumen.activos ?? 0,
                          color: "#198754",
                        },
                        {
                          name: "Vencidos",
                          value: resumen.vencidos ?? 0,
                          color: "#dc3545",
                        },
                        {
                          name: "Consumidos",
                          value: resumen.consumidos ?? 0,
                          color: "#6c757d",
                        },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {[
                        { color: "#198754" },
                        { color: "#dc3545" },
                        { color: "#6c757d" },
                      ].map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tablas y accesos rápidos */}
      <div className="row g-4">
        {/* Lotes críticos */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold small">
                <i className="bi bi-exclamation-circle text-danger me-2" />
                Lotes críticos
              </span>
              <span className="badge bg-danger">{lotesCriticos.length}</span>
            </div>
            <div className="card-body p-0">
              <Tabla
                columnas={COLUMNAS_LOTES_CRITICOS}
                datos={lotesCriticos}
                cargando={cargando}
                mensajeVacio="No hay lotes críticos. ¡Todo en orden!"
              />
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">
          {/* Top mermas */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold small">
                <i className="bi bi-exclamation-triangle text-warning me-2" />
                Top mermas
              </span>
            </div>
            <div className="card-body p-0">
              <Tabla
                columnas={COLUMNAS_MERMAS}
                datos={mermas.slice(0, 5)}
                cargando={cargando}
                mensajeVacio="Sin mermas registradas."
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
                  label: "Registrar lote",
                  icono: "bi bi-plus-circle",
                  ruta: "/lotes",
                  color: "outline-primary",
                },
                {
                  label: "Ver movimientos",
                  icono: "bi bi-arrow-left-right",
                  ruta: "/movimientos",
                  color: "outline-secondary",
                },
                {
                  label: "Gestionar empleados",
                  icono: "bi bi-people",
                  ruta: "/empleados",
                  color: "outline-secondary",
                },
                {
                  label: "Ver auditoría",
                  icono: "bi bi-journal-text",
                  ruta: "/auditoria",
                  color: "outline-dark",
                },
                {
                  label: "Ver reportes completos",
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
