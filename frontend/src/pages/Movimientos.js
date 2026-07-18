import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Tabla from "../components/Tabla";
import Modal from "../components/Modal";
import api from "../services/api";

const FORM_INICIAL = {
  insumoId: "",
  tipo: "salida",
  cantidad: "",
  observacion: "",
  motivo_merma: "",
};

// Badge por tipo de movimiento
const BadgeTipo = ({ tipo }) => {
  const config = {
    ingreso: { bg: "primary", label: "Ingreso" },
    apertura: { bg: "info", label: "Apertura" },
    preparacion: { bg: "warning", label: "Preparación" },
    salida: { bg: "secondary", label: "Salida" },
    merma: { bg: "danger", label: "Merma" },
  };
  const c = config[tipo] ?? { bg: "secondary", label: tipo };
  return (
    <span
      className={`badge bg-${c.bg} text-${c.bg === "warning" ? "dark" : "white"}`}
    >
      {c.label}
    </span>
  );
};

const COLUMNAS = [
  { label: "ID", key: "id_movimiento" },
  { label: "Insumo", key: "nombre" },
  { label: "Tipo", key: "tipo", render: (val) => <BadgeTipo tipo={val} /> },
  { label: "Cantidad", key: "cantidad" },
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
  { label: "Observación", key: "observacion", render: (val) => val || "—" },
  { label: "Motivo merma", key: "motivo_merma", render: (val) => val || "—" },
];

// Tipos que descuentan stock — muestran campo extra de motivo si es merma
const TIPOS_MOVIMIENTO = [
  { value: "salida", label: "Salida" },
  { value: "merma", label: "Merma" },
  { value: "apertura", label: "Apertura" },
];

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [modalForm, setModalForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);

  // Filtro por tipo
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Usuario de sesión para registrar id_usuario
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  // ── Cargar datos ─────────────────────────────────────────
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resMov, resIns] = await Promise.all([
        api.get("/movimientos"),
        api.get("/insumos"),
      ]);
      setMovimientos(resMov.data);
      setInsumos(resIns.data);
    } catch {
      setError("Error al cargar los movimientos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ── Filtrar por tipo ─────────────────────────────────────
  const movimientosFiltrados =
    filtroTipo === "todos"
      ? movimientos
      : movimientos.filter((m) => m.tipo === filtroTipo);

  // ── Contadores para filtros ──────────────────────────────
  const conteo = (tipo) => movimientos.filter((m) => m.tipo === tipo).length;

  // ── Abrir modal ──────────────────────────────────────────
  const abrirCrear = () => {
    setForm(FORM_INICIAL);
    setError("");
    setModalForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      // Limpiar motivo_merma si cambia a otro tipo
      ...(name === "tipo" && value !== "merma" ? { motivo_merma: "" } : {}),
    }));
  };

  // ── Validación ───────────────────────────────────────────
  const validar = () => {
    if (!form.insumoId) return "Selecciona un insumo.";
    if (!form.tipo) return "Selecciona un tipo de movimiento.";
    if (!form.cantidad || form.cantidad <= 0)
      return "La cantidad debe ser mayor a 0.";
    if (form.tipo === "merma" && !form.motivo_merma.trim())
      return "El motivo de la merma es obligatorio.";
    return "";
  };

  // ── Registrar movimiento ─────────────────────────────────
  const handleGuardar = async () => {
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    setGuardando(true);
    setError("");
    try {
      await api.post("/movimientos", {
        insumoId: Number(form.insumoId),
        tipo: form.tipo,
        cantidad: Number(form.cantidad),
        id_usuario: usuario.id_usuario,
        observacion: form.observacion || null,
        motivo_merma: form.motivo_merma || null,
      });
      setModalForm(false);
      cargarDatos();
    } catch (err) {
      // El backend devuelve mensaje de stock insuficiente
      setError(
        err.response?.data?.mensaje || "Error al registrar el movimiento.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout titulo="Movimientos">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="fw-bold mb-0">Movimientos</h5>
          <p className="text-muted small mb-0">
            Salidas, mermas y aperturas de lotes
          </p>
        </div>
        <button
          className="btn btn-danger btn-sm d-flex align-items-center gap-2"
          onClick={abrirCrear}
        >
          <i className="bi bi-plus-lg" />
          Nuevo movimiento
        </button>
      </div>

      {/* Error global */}
      {error && !modalForm && (
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

      {/* Filtros por tipo */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button
          onClick={() => setFiltroTipo("todos")}
          className={`btn btn-sm ${filtroTipo === "todos" ? "btn-secondary" : "btn-outline-secondary"}`}
        >
          Todos
          <span className="badge bg-white text-dark ms-2">
            {movimientos.length}
          </span>
        </button>
        {[
          { tipo: "salida", bg: "secondary" },
          { tipo: "merma", bg: "danger" },
          { tipo: "apertura", bg: "info" },
          { tipo: "preparacion", bg: "warning" },
          { tipo: "ingreso", bg: "primary" },
        ].map(({ tipo, bg }) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            className={`btn btn-sm ${filtroTipo === tipo ? `btn-${bg}` : `btn-outline-${bg}`}`}
          >
            {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            <span className="badge bg-white text-dark ms-2">
              {conteo(tipo)}
            </span>
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Tabla
            columnas={COLUMNAS}
            datos={movimientosFiltrados}
            cargando={cargando}
            mensajeVacio="No hay movimientos registrados."
          />
        </div>
      </div>

      {/* ── Modal nuevo movimiento ── */}
      <Modal
        show={modalForm}
        onClose={() => setModalForm(false)}
        titulo="Nuevo movimiento"
        onConfirmar={handleGuardar}
        textoConfirmar="Registrar"
        cargando={guardando}
      >
        {error && (
          <div className="alert alert-danger py-2 small mb-3">{error}</div>
        )}

        {/* Insumo */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Insumo *</label>
          <select
            name="insumoId"
            className="form-select"
            value={form.insumoId}
            onChange={handleChange}
          >
            <option value="">Selecciona un insumo...</option>
            {insumos.map((i) => (
              <option key={i.id_insumo} value={i.id_insumo}>
                {i.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Tipo *</label>
          <select
            name="tipo"
            className="form-select"
            value={form.tipo}
            onChange={handleChange}
          >
            {TIPOS_MOVIMIENTO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Cantidad *</label>
          <input
            name="cantidad"
            type="number"
            min="1"
            className="form-control"
            placeholder="Ej: 10"
            value={form.cantidad}
            onChange={handleChange}
          />
        </div>

        {/* Motivo merma — solo si tipo === merma */}
        {form.tipo === "merma" && (
          <div className="mb-3">
            <label className="form-label fw-semibold">Motivo de merma *</label>
            <input
              name="motivo_merma"
              type="text"
              className="form-control"
              placeholder="Ej: Producto dañado, caducado..."
              value={form.motivo_merma}
              onChange={handleChange}
            />
          </div>
        )}

        {/* Observación */}
        <div className="mb-1">
          <label className="form-label fw-semibold">
            Observación
            <span className="text-muted fw-normal ms-1">(opcional)</span>
          </label>
          <textarea
            name="observacion"
            className="form-control"
            rows={2}
            placeholder="Notas adicionales..."
            value={form.observacion}
            onChange={handleChange}
          />
        </div>
      </Modal>
    </Layout>
  );
}
