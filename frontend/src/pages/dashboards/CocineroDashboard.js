import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Tabla from "../../components/Tabla";
import api from "../../services/api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

const COLUMNAS_PREPARACIONES = [
  { label: "Insumo", key: "nombre" },
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
  {
    label: "Obs.",
    key: "observacion",
    render: (val) =>
      val ? (
        <span title={val} style={{ fontSize: "0.8rem", color: "#6b7280" }}>
          {val.substring(0, 30)}
          {val.length > 30 ? "..." : ""}
        </span>
      ) : (
        "—"
      ),
  },
];

const COLUMNAS_INSUMOS = [
  { label: "Insumo", key: "nombre" },
  {
    label: "Días prep.",
    key: "dias_duracion_preparado",
    render: (val) => val ?? "—",
  },
];

// Color según urgencia: vencido/hoy = rojo, mañana = naranja, 2-3 días = amarillo
function colorPorUrgencia(dias) {
  if (dias <= 0) return "#dc2626"; // rojo
  if (dias === 1) return "#f97316"; // naranja
  return "#facc15"; // amarillo
}

export default function CocineroDashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const [preparaciones, setPreparaciones] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resMov, resIns, resLotes] = await Promise.all([
        api.get("/movimientos"),
        api.get("/insumos"),
        api.get("/lotes"),
      ]);
      setPreparaciones(
        resMov.data.filter((m) => m.tipo === "preparacion").slice(0, 8),
      );
      setInsumos(resIns.data.filter((i) => i.usa_preparacion));
      setLotes(resLotes.data.filter((l) => l.estado === "activo"));
    } catch {
      console.error("Error al cargar dashboard cocinero");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Lotes próximos a vencer (≤3 días)
  const lotesAlerta = lotes.filter((l) => {
    const dias = Math.ceil(
      (new Date(l.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24),
    );
    return dias <= 3;
  });

  // Datos para el gráfico: insumo + días restantes, ordenados del más urgente al menos urgente
  const dataVencimiento = lotesAlerta
    .map((l) => {
      const dias = Math.ceil(
        (new Date(l.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24),
      );
      return {
        nombre: l.nombre,
        dias,
        etiqueta: dias <= 0 ? "Vencido" : `${dias}d`,
      };
    })
    .sort((a, b) => a.dias - b.dias);

  return (
    <Layout titulo="Dashboard Cocinero">
      <div className="mb-4">
        <h5 className="fw-bold mb-0">Bienvenido, {usuario.nombres} 👋</h5>
        <p className="text-muted small mb-0">Panel de preparación de insumos</p>
      </div>

      {/* Cards */}
      {cargando ? (
        <div className="text-center py-4">
          <div className="spinner-border text-danger" role="status" />
        </div>
      ) : (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-4">
            <Card
              titulo="Insumos disponibles"
              valor={insumos.length}
              icono="bi bi-box-seam"
              variante="success"
            />
          </div>
          <div className="col-6 col-md-4">
            <Card
              titulo="Lotes activos"
              valor={lotes.length}
              icono="bi bi-layers"
              variante="primary"
            />
          </div>
          <div className="col-6 col-md-4">
            <Card
              titulo="Próx. a vencer"
              valor={lotesAlerta.length}
              icono="bi bi-clock-history"
              variante="warning"
              subtitulo="en 3 días"
            />
          </div>
        </div>
      )}

      {/* Alerta si hay lotes próximos a vencer */}
      {!cargando && lotesAlerta.length > 0 && (
        <div className="alert alert-warning d-flex align-items-center gap-2 py-2 small mb-4">
          <i className="bi bi-exclamation-triangle-fill fs-5" />
          <span>
            Hay <strong>{lotesAlerta.length}</strong> lote(s) que vencen en los
            próximos 3 días. Úsalos con prioridad.
          </span>
        </div>
      )}

      {/* Gráfico: insumos próximos a vencer — fila de ancho completo */}
      <div className="row g-4 mt-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-2">
              <span className="fw-semibold small">
                <i className="bi bi-clock-history text-warning me-2" />
                Insumos próximos a vencer
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
              ) : dataVencimiento.length === 0 ? (
                <p className="text-muted small mb-0 text-center py-4">
                  No hay insumos próximos a vencer.
                </p>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(dataVencimiento.length * 60, 200)}
                >
                  <BarChart
                    data={dataVencimiento}
                    layout="vertical"
                    margin={{ top: 10, right: 50, left: 10, bottom: 10 }}
                  >
                    <XAxis type="number" allowDecimals={false} hide />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={130}
                      tick={{ fontSize: 14 }}
                    />
                    <Tooltip
                      formatter={(value, _name, props) => [
                        props.payload.etiqueta,
                        "Vence en",
                      ]}
                    />
                    <Bar dataKey="dias" radius={[0, 6, 6, 0]} barSize={32}>
                      {dataVencimiento.map((entry, index) => (
                        <Cell key={index} fill={colorPorUrgencia(entry.dias)} />
                      ))}
                      <LabelList
                        dataKey="etiqueta"
                        position="right"
                        style={{ fontSize: 14, fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-4">
        {/* Últimas preparaciones */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold small">
                <i className="bi bi-fire text-danger me-2" />
                Últimas preparaciones
              </span>
              <button
                className="btn btn-link btn-sm p-0 text-decoration-none"
                onClick={() => navigate("/preparacion")}
              >
                Ver todas <i className="bi bi-arrow-right" />
              </button>
            </div>
            <div className="card-body p-0">
              <Tabla
                columnas={COLUMNAS_PREPARACIONES}
                datos={preparaciones}
                cargando={cargando}
                mensajeVacio="No hay preparaciones registradas hoy."
              />
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">
          {/* Insumos para preparación */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-2">
              <span className="fw-semibold small">
                <i className="bi bi-box-seam text-success me-2" />
                Insumos para preparación
              </span>
            </div>
            <div className="card-body p-0">
              <Tabla
                columnas={COLUMNAS_INSUMOS}
                datos={insumos}
                cargando={cargando}
                mensajeVacio="Sin insumos configurados para preparación."
              />
            </div>
          </div>

          {/* Acción principal */}
          <div className="card border-0 shadow-sm">
            <div className="card-body d-flex flex-column gap-2">
              <button
                className="btn btn-danger d-flex align-items-center justify-content-center gap-2 py-3"
                onClick={() => navigate("/preparacion")}
              >
                <i className="bi bi-fire fs-5" />
                <span className="fw-semibold">Registrar preparación</span>
              </button>
              <button
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                onClick={() => navigate("/lotes")}
              >
                <i className="bi bi-layers" />
                Ver lotes disponibles
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
