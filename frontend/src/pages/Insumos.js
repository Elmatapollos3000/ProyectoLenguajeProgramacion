import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Tabla from "../components/Tabla";
import Modal from "../components/Modal";
import api from "../services/api";

// Estado inicial del formulario — coincide con los campos del backend
const FORM_INICIAL = {
  nombre: "",
  usaProveedor: false,
  usaApertura: false,
  usaPreparacion: false,
  diasBase: "",
  diasAbierto: "",
  diasPreparado: "",
  retirarDias: "",
};

// Columnas de la tabla
const COLUMNAS = [
  { label: "Nombre", key: "nombre" },
  { label: "Días base", key: "dias_duracion_base" },
  { label: "Días abierto", key: "dias_duracion_abierto" },
  { label: "Días preparado", key: "dias_duracion_preparado" },
  { label: "Retirar antes (d)", key: "retirar_antes_dias" },
  {
    label: "Usa proveedor",
    key: "usa_fecha_proveedor",
    render: (val) => (
      <span className={`badge bg-${val ? "success" : "secondary"}`}>
        {val ? "Sí" : "No"}
      </span>
    ),
  },
  {
    label: "Usa apertura",
    key: "usa_apertura",
    render: (val) => (
      <span className={`badge bg-${val ? "success" : "secondary"}`}>
        {val ? "Sí" : "No"}
      </span>
    ),
  },
  {
    label: "Usa preparación",
    key: "usa_preparacion",
    render: (val) => (
      <span className={`badge bg-${val ? "success" : "secondary"}`}>
        {val ? "Sí" : "No"}
      </span>
    ),
  },
];

export default function Insumos() {
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Modal formulario (crear / editar)
  const [modalForm, setModalForm] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);

  // Modal confirmación eliminar
  const [modalEliminar, setModalEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // ── Cargar insumos ───────────────────────────────────────
  const cargarInsumos = async () => {
    setCargando(true);
    try {
      const { data } = await api.get("/insumos");
      setInsumos(data);
    } catch {
      setError("Error al cargar los insumos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInsumos();
  }, []);

  // ── Abrir modal para crear ───────────────────────────────
  const abrirCrear = () => {
    setForm(FORM_INICIAL);
    setModoEdicion(false);
    setSeleccionado(null);
    setError("");
    setModalForm(true);
  };

  // ── Abrir modal para editar ──────────────────────────────
  const abrirEditar = (fila) => {
    setForm({
      nombre: fila.nombre,
      usaProveedor: !!fila.usa_fecha_proveedor,
      usaApertura: !!fila.usa_apertura,
      usaPreparacion: !!fila.usa_preparacion,
      diasBase: fila.dias_duracion_base ?? "",
      diasAbierto: fila.dias_duracion_abierto ?? "",
      diasPreparado: fila.dias_duracion_preparado ?? "",
      retirarDias: fila.retirar_antes_dias ?? "",
    });
    setSeleccionado(fila);
    setModoEdicion(true);
    setError("");
    setModalForm(true);
  };

  // ── Abrir modal para eliminar ────────────────────────────
  const abrirEliminar = (fila) => {
    setSeleccionado(fila);
    setModalEliminar(true);
  };

  // ── Cambios en el formulario ─────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ── Validación ───────────────────────────────────────────
  const validar = () => {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (!form.diasBase) return "Los días de duración base son obligatorios.";
    return "";
  };

  // ── Guardar (crear o editar) ─────────────────────────────
  const handleGuardar = async () => {
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    setGuardando(true);
    setError("");

    try {
      if (modoEdicion) {
        await api.put(`/insumos/${seleccionado.id_insumo}`, form);
      } else {
        await api.post("/insumos", form);
      }
      setModalForm(false);
      cargarInsumos();
    } catch {
      setError("Error al guardar el insumo. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  // ── Eliminar ─────────────────────────────────────────────
  const handleEliminar = async () => {
    setEliminando(true);
    try {
      await api.delete(`/insumos/${seleccionado.id_insumo}`);
      setModalEliminar(false);
      cargarInsumos();
    } catch {
      setError("Error al eliminar el insumo.");
    } finally {
      setEliminando(false);
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <Layout titulo="Insumos">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-0">Insumos</h5>
          <p className="text-muted small mb-0">
            Gestión de insumos y sus reglas de vencimiento
          </p>
        </div>
        <button
          className="btn btn-danger btn-sm d-flex align-items-center gap-2"
          onClick={abrirCrear}
        >
          <i className="bi bi-plus-lg" />
          Nuevo insumo
        </button>
      </div>

      {/* Error global */}
      {error && !modalForm && !modalEliminar && (
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

      {/* Tabla */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Tabla
            columnas={COLUMNAS}
            datos={insumos}
            cargando={cargando}
            onEditar={abrirEditar}
            onEliminar={abrirEliminar}
            mensajeVacio="No hay insumos registrados."
          />
        </div>
      </div>

      {/* ── Modal formulario ── */}
      <Modal
        show={modalForm}
        onClose={() => setModalForm(false)}
        titulo={modoEdicion ? "Editar insumo" : "Nuevo insumo"}
        onConfirmar={handleGuardar}
        textoConfirmar={modoEdicion ? "Actualizar" : "Guardar"}
        cargando={guardando}
      >
        {/* Error dentro del modal */}
        {error && (
          <div className="alert alert-danger py-2 small mb-3">{error}</div>
        )}

        {/* Nombre */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Nombre *</label>
          <input
            name="nombre"
            type="text"
            className="form-control"
            placeholder="Ej: Pollo, Harina, Aceite..."
            value={form.nombre}
            onChange={handleChange}
          />
        </div>

        {/* Días */}
        <div className="row g-2 mb-3">
          <div className="col-6">
            <label className="form-label fw-semibold">Días base *</label>
            <input
              name="diasBase"
              type="number"
              min="0"
              className="form-control"
              placeholder="0"
              value={form.diasBase}
              onChange={handleChange}
            />
          </div>
          <div className="col-6">
            <label className="form-label fw-semibold">Días abierto</label>
            <input
              name="diasAbierto"
              type="number"
              min="0"
              className="form-control"
              placeholder="0"
              value={form.diasAbierto}
              onChange={handleChange}
            />
          </div>
          <div className="col-6">
            <label className="form-label fw-semibold">Días preparado</label>
            <input
              name="diasPreparado"
              type="number"
              min="0"
              className="form-control"
              placeholder="0"
              value={form.diasPreparado}
              onChange={handleChange}
            />
          </div>
          <div className="col-6">
            <label className="form-label fw-semibold">
              Retirar antes (días)
            </label>
            <input
              name="retirarDias"
              type="number"
              min="0"
              className="form-control"
              placeholder="0"
              value={form.retirarDias}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Checkboxes de banderas */}
        <p className="fw-semibold mb-2 small text-muted">
          Reglas de vencimiento
        </p>
        <div className="d-flex flex-column gap-2">
          <div className="form-check">
            <input
              id="usaProveedor"
              name="usaProveedor"
              type="checkbox"
              className="form-check-input"
              checked={form.usaProveedor}
              onChange={handleChange}
            />
            <label htmlFor="usaProveedor" className="form-check-label small">
              Usa fecha del proveedor para calcular vencimiento
            </label>
          </div>
          <div className="form-check">
            <input
              id="usaApertura"
              name="usaApertura"
              type="checkbox"
              className="form-check-input"
              checked={form.usaApertura}
              onChange={handleChange}
            />
            <label htmlFor="usaApertura" className="form-check-label small">
              Recalcula vencimiento al abrir el envase
            </label>
          </div>
          <div className="form-check">
            <input
              id="usaPreparacion"
              name="usaPreparacion"
              type="checkbox"
              className="form-check-input"
              checked={form.usaPreparacion}
              onChange={handleChange}
            />
            <label htmlFor="usaPreparacion" className="form-check-label small">
              Se puede usar en preparaciones
            </label>
          </div>
        </div>
      </Modal>

      {/* ── Modal confirmar eliminar ── */}
      <Modal
        show={modalEliminar}
        onClose={() => setModalEliminar(false)}
        titulo="Eliminar insumo"
        onConfirmar={handleEliminar}
        textoConfirmar="Eliminar"
        variante="danger"
        cargando={eliminando}
      >
        <p className="mb-0">
          ¿Seguro que deseas eliminar el insumo{" "}
          <strong>{seleccionado?.nombre}</strong>?
          <br />
          <span className="text-muted small">
            Esta acción no se puede deshacer.
          </span>
        </p>
      </Modal>
    </Layout>
  );
}
