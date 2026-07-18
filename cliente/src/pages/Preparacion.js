import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Tabla from "../components/Tabla";
import Modal from "../components/Modal";
import api from "../services/api";

const FORM_INICIAL = {
  insumoId: "",
  cantidad: "",
  observacion: "",
};

const COLUMNAS = [
  { label: "ID", key: "id_movimiento" },
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
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
  },
  { label: "Observación", key: "observacion", render: (val) => val || "—" },
];

export default function Preparacion() {
  const [preparaciones, setPreparaciones] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [modalForm, setModalForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  // ── Cargar datos ─────────────────────────────────────────
  const cargarDatos = async () => {
    setCargando(true);
    try {
      // Movimientos filtrados por tipo preparacion + insumos para el select
      const [resMov, resIns] = await Promise.all([
        api.get("/movimientos"),
        api.get("/insumos"),
      ]);
      // Solo mostrar preparaciones en esta vista
      setPreparaciones(resMov.data.filter((m) => m.tipo === "preparacion"));
      // Solo insumos que usan preparacion
      setInsumos(resIns.data.filter((i) => i.usa_preparacion));
    } catch {
      setError("Error al cargar los datos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ── Abrir modal ──────────────────────────────────────────
  const abrirRegistrar = () => {
    setForm(FORM_INICIAL);
    setError("");
    setExito("");
    setModalForm(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ── Validación ───────────────────────────────────────────
  const validar = () => {
    if (!form.insumoId) return "Selecciona un insumo.";
    if (!form.cantidad || form.cantidad <= 0)
      return "La cantidad debe ser mayor a 0.";
    return "";
  };

  // ── Registrar preparación ────────────────────────────────
  const handleGuardar = async () => {
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    setGuardando(true);
    setError("");
    try {
      await api.post("/preparacion", {
        insumoId: Number(form.insumoId),
        cantidad: Number(form.cantidad),
        id_usuario: usuario.id_usuario,
        observacion: form.observacion || null,
      });
      setModalForm(false);
      setExito("Preparación registrada correctamente.");
      cargarDatos();
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setExito(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.mensaje || "Error al registrar la preparación.",
      );
    } finally {
      setGuardando(false);
    }
  };

  // ── Insumo seleccionado (para mostrar info en el modal) ──
  const insumoSeleccionado = insumos.find(
    (i) => i.id_insumo === Number(form.insumoId),
  );

  return (
    <Layout titulo="Preparación">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="fw-bold mb-0">Preparación</h5>
          <p className="text-muted small mb-0">
            Registro de insumos usados en cocina — descuenta stock
            automáticamente
          </p>
        </div>
        <button
          className="btn btn-danger btn-sm d-flex align-items-center gap-2"
          onClick={abrirRegistrar}
        >
          <i className="bi bi-fire" />
          Registrar preparación
        </button>
      </div>

      {/* Mensaje de éxito */}
      {exito && (
        <div
          className="alert alert-success alert-dismissible py-2 small"
          role="alert"
        >
          <i className="bi bi-check-circle me-2" />
          {exito}
          <button
            type="button"
            className="btn-close"
            onClick={() => setExito("")}
          />
        </div>
      )}

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

      {/* Info FIFO */}
      <div className="alert alert-info py-2 small mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-info-circle-fill" />
        El sistema descuenta automáticamente del lote más antiguo disponible
        (FIFO).
      </div>

      {/* Tabla de preparaciones */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom py-2">
          <span className="fw-semibold small">
            Historial de preparaciones
            <span className="badge bg-secondary ms-2">
              {preparaciones.length}
            </span>
          </span>
        </div>
        <div className="card-body p-0">
          <Tabla
            columnas={COLUMNAS}
            datos={preparaciones}
            cargando={cargando}
            mensajeVacio="No hay preparaciones registradas."
          />
        </div>
      </div>

      {/* ── Modal registrar preparación ── */}
      <Modal
        show={modalForm}
        onClose={() => setModalForm(false)}
        titulo="Registrar preparación"
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
          {insumos.length === 0 && !cargando && (
            <p className="form-text text-warning mb-0">
              No hay insumos marcados para preparación. Activa la opción en
              Insumos.
            </p>
          )}
        </div>

        {/* Info del insumo seleccionado */}
        {insumoSeleccionado && (
          <div className="alert alert-light border py-2 small mb-3">
            <i className="bi bi-box-seam me-1" />
            <strong>{insumoSeleccionado.nombre}</strong>
            {insumoSeleccionado.dias_duracion_preparado && (
              <span className="text-muted ms-2">
                · Duración preparado:{" "}
                {insumoSeleccionado.dias_duracion_preparado} días
              </span>
            )}
          </div>
        )}

        {/* Cantidad */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Cantidad *</label>
          <input
            name="cantidad"
            type="number"
            min="1"
            className="form-control"
            placeholder="Ej: 5"
            value={form.cantidad}
            onChange={handleChange}
          />
        </div>

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
            placeholder="Ej: Preparación turno mañana..."
            value={form.observacion}
            onChange={handleChange}
          />
        </div>
      </Modal>
    </Layout>
  );
}
