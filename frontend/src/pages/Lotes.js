import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Tabla from "../components/Tabla";
import Modal from "../components/Modal";
import api from "../services/api";

const FORM_INICIAL = {
  id_insumo: "",
  cantidad: "",
  fecha_proveedor: "",
};

// Badge de estado del lote
const BadgeEstado = ({ estado }) => {
  const config = {
    activo: { bg: "success", label: "Activo" },
    vencido: { bg: "danger", label: "Vencido" },
    consumido: { bg: "secondary", label: "Consumido" },
  };
  const c = config[estado] ?? { bg: "secondary", label: estado };
  return <span className={`badge bg-${c.bg}`}>{c.label}</span>;
};

const COLUMNAS = [
  { label: "ID", key: "id_lote" },
  { label: "Insumo", key: "nombre" },
  { label: "Cantidad actual", key: "cantidad_actual" },
  {
    label: "Fecha ingreso",
    key: "fecha_ingreso",
    render: (val) => (val ? new Date(val).toLocaleDateString("es-PE") : "—"),
  },
  {
    label: "Fecha proveedor",
    key: "fecha_proveedor",
    render: (val) => (val ? new Date(val).toLocaleDateString("es-PE") : "—"),
  },
  {
    label: "Fecha apertura",
    key: "fecha_apertura",
    render: (val) => (val ? new Date(val).toLocaleDateString("es-PE") : "—"),
  },
  {
    label: "Vencimiento",
    key: "fecha_vencimiento",
    render: (val) => {
      if (!val) return "—";
      const fecha = new Date(val);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
      const texto = fecha.toLocaleDateString("es-PE");
      // Resaltar en rojo si vence en 3 días o menos
      if (diasRestantes <= 3) {
        return <span className="text-danger fw-semibold">{texto}</span>;
      }
      return texto;
    },
  },
  {
    label: "Estado",
    key: "estado",
    render: (val) => <BadgeEstado estado={val} />,
  },
];

export default function Lotes() {
  const [lotes, setLotes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [modalForm, setModalForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);

  // Filtro de estado
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // ── Cargar datos ─────────────────────────────────────────
  const cargarLotes = async () => {
    setCargando(true);
    try {
      const [resLotes, resInsumos] = await Promise.all([
        api.get("/lotes"),
        api.get("/insumos"),
      ]);
      setLotes(resLotes.data);
      setInsumos(resInsumos.data);
    } catch {
      setError("Error al cargar los lotes.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLotes();
  }, []);

  // ── Filtrar lotes por estado ─────────────────────────────
  const lotesFiltrados =
    filtroEstado === "todos"
      ? lotes
      : lotes.filter((l) => l.estado === filtroEstado);

  // ── Abrir modal crear ────────────────────────────────────
  const abrirCrear = () => {
    setForm(FORM_INICIAL);
    setError("");
    setModalForm(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ── Validación ───────────────────────────────────────────
  const validar = () => {
    if (!form.id_insumo) return "Selecciona un insumo.";
    if (!form.cantidad || form.cantidad <= 0)
      return "La cantidad debe ser mayor a 0.";
    return "";
  };

  // ── Guardar lote ─────────────────────────────────────────
  const handleGuardar = async () => {
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    setGuardando(true);
    setError("");
    try {
      await api.post("/lotes", {
        id_insumo: form.id_insumo,
        cantidad: Number(form.cantidad),
        fecha_proveedor: form.fecha_proveedor || null,
      });
      setModalForm(false);
      cargarLotes();
    } catch {
      setError("Error al registrar el lote. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  // ── Contadores para las pills de filtro ──────────────────
  const conteo = {
    todos: lotes.length,
    activo: lotes.filter((l) => l.estado === "activo").length,
    vencido: lotes.filter((l) => l.estado === "vencido").length,
    consumido: lotes.filter((l) => l.estado === "consumido").length,
  };

  return (
    <Layout titulo="Lotes">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="fw-bold mb-0">Lotes</h5>
          <p className="text-muted small mb-0">
            Registro de lotes de insumos con control FIFO
          </p>
        </div>
        <button
          className="btn btn-danger btn-sm d-flex align-items-center gap-2"
          onClick={abrirCrear}
        >
          <i className="bi bi-plus-lg" />
          Nuevo lote
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

      {/* Filtros de estado */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[
          { key: "todos", label: "Todos", bg: "secondary" },
          { key: "activo", label: "Activos", bg: "success" },
          { key: "vencido", label: "Vencidos", bg: "danger" },
          { key: "consumido", label: "Consumidos", bg: "dark" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltroEstado(f.key)}
            className={`btn btn-sm ${
              filtroEstado === f.key ? `btn-${f.bg}` : `btn-outline-${f.bg}`
            }`}
          >
            {f.label}
            <span className="badge bg-white text-dark ms-2">
              {conteo[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Tabla
            columnas={COLUMNAS}
            datos={lotesFiltrados}
            cargando={cargando}
            mensajeVacio="No hay lotes para mostrar."
          />
        </div>
      </div>

      {/* ── Modal nuevo lote ── */}
      <Modal
        show={modalForm}
        onClose={() => setModalForm(false)}
        titulo="Nuevo lote"
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
            name="id_insumo"
            className="form-select"
            value={form.id_insumo}
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

        {/* Cantidad */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Cantidad *</label>
          <input
            name="cantidad"
            type="number"
            min="1"
            className="form-control"
            placeholder="Ej: 50"
            value={form.cantidad}
            onChange={handleChange}
          />
        </div>

        {/* Fecha proveedor (opcional) */}
        <div className="mb-1">
          <label className="form-label fw-semibold">
            Fecha de vencimiento del proveedor
            <span className="text-muted fw-normal ms-1">(opcional)</span>
          </label>
          <input
            name="fecha_proveedor"
            type="date"
            className="form-control"
            value={form.fecha_proveedor}
            onChange={handleChange}
          />
          <p className="form-text mb-0">
            Si el insumo usa fecha de proveedor, el sistema calculará el
            vencimiento automáticamente.
          </p>
        </div>
      </Modal>
    </Layout>
  );
}
