import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Tabla from "../components/Tabla";
import api from "../services/api";

const COLUMNAS_MERMAS = [
  { label: "Insumo", key: "nombre" },
  { label: "Total merma", key: "total_merma" },
  { label: "Registros", key: "cantidad_registros" },
];

const COLUMNAS_MOVIMIENTOS = [
  {
    label: "Tipo",
    key: "tipo",
    render: (val) => {
      const config = {
        ingreso: { bg: "primary", label: "Ingreso" },
        apertura: { bg: "info", label: "Apertura" },
        preparacion: { bg: "warning", label: "Preparación" },
        salida: { bg: "secondary", label: "Salida" },
        merma: { bg: "danger", label: "Merma" },
      };
      const c = config[val] ?? { bg: "secondary", label: val };
      return (
        <span
          className={`badge bg-${c.bg} text-${c.bg === "warning" ? "dark" : "white"}`}
        >
          {c.label}
        </span>
      );
    },
  },
  { label: "Total registros", key: "total_registros" },
  { label: "Total cantidad", key: "total_cantidad" },
];

export default function Reportes() {
  const [resumen, setResumen] = useState(null);
  const [mermas, setMermas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // ── Cargar todos los reportes en paralelo ────────────────
  const cargarReportes = async () => {
    setCargando(true);
    setError("");
    try {
      const [resRes, resMer, resMov] = await Promise.all([
        api.get("/reportes"),
        api.get("/reportes/mermas"),
        api.get("/reportes/movimientos"),
      ]);
      setResumen(resRes.data);
      setMermas(resMer.data);
      setMovimientos(resMov.data);
    } catch {
      setError("Error al cargar los reportes.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  return (
    <Layout titulo="Reportes">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-0">Reportes</h5>
          <p className="text-muted small mb-0">
            Resumen general del inventario
          </p>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
          onClick={cargarReportes}
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

      {/* ── Sección 1: Cards de resumen ── */}
      <p
        className="fw-semibold text-muted small text-uppercase mb-2"
        style={{ letterSpacing: ".05em" }}
      >
        Resumen de lotes
      </p>
      {cargando ? (
        <div className="text-center py-4">
          <div className="spinner-border text-danger" role="status" />
        </div>
      ) : (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-4 col-xl-2">
            <Card
              titulo="Total lotes"
              valor={resumen?.total_lotes ?? 0}
              icono="bi bi-layers"
              variante="primary"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-2">
            <Card
              titulo="Activos"
              valor={resumen?.activos ?? 0}
              icono="bi bi-check-circle"
              variante="success"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-2">
            <Card
              titulo="Vencidos"
              valor={resumen?.vencidos ?? 0}
              icono="bi bi-x-circle"
              variante="danger"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-2">
            <Card
              titulo="Consumidos"
              valor={resumen?.consumidos ?? 0}
              icono="bi bi-archive"
              variante="secondary"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-2">
            <Card
              titulo="Stock total"
              valor={resumen?.stock_total ?? 0}
              icono="bi bi-box-seam"
              variante="primary"
              subtitulo="unidades"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-2">
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

      {/* ── Sección 2: Mermas por insumo + Movimientos ── */}
      <div className="row g-4">
        {/* Mermas */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold small">
                <i className="bi bi-exclamation-triangle text-danger me-2" />
                Mermas por insumo
              </span>
              <span className="badge bg-secondary">{mermas.length}</span>
            </div>
            <div className="card-body p-0">
              <Tabla
                columnas={COLUMNAS_MERMAS}
                datos={mermas}
                cargando={cargando}
                mensajeVacio="No hay mermas registradas."
              />
            </div>
          </div>
        </div>

        {/* Movimientos por tipo */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold small">
                <i className="bi bi-arrow-left-right text-primary me-2" />
                Movimientos por tipo
              </span>
              <span className="badge bg-secondary">{movimientos.length}</span>
            </div>
            <div className="card-body p-0">
              <Tabla
                columnas={COLUMNAS_MOVIMIENTOS}
                datos={movimientos}
                cargando={cargando}
                mensajeVacio="No hay movimientos registrados."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estilos animación recarga */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { display: inline-block; animation: spin 1s linear infinite; }
      `}</style>
    </Layout>
  );
}
