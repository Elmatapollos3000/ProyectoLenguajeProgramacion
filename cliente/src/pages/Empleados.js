import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Tabla from "../components/Tabla";
import Modal from "../components/Modal";
import api from "../services/api";

const FORM_INICIAL = {
  nombres: "",
  apellidos: "",
  correo: "",
  numero: "",
  fecha_ingreso: "",
};

const COLUMNAS = [
  { label: "ID", key: "id_empleado" },
  { label: "Nombres", key: "nombres" },
  { label: "Apellidos", key: "apellidos" },
  {
    label: "Correo",
    key: "correo",
    render: (val) =>
      val ? (
        <a href={`mailto:${val}`} className="text-decoration-none">
          {val}
        </a>
      ) : (
        "—"
      ),
  },
  { label: "Teléfono", key: "numero", render: (val) => val || "—" },
  {
    label: "Fecha ingreso",
    key: "fecha_ingreso",
    render: (val) => (val ? new Date(val).toLocaleDateString("es-PE") : "—"),
  },
];

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [modalForm, setModalForm] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);

  // Búsqueda
  const [busqueda, setBusqueda] = useState("");

  // ── Cargar empleados ─────────────────────────────────────
  const cargarEmpleados = async () => {
    setCargando(true);
    try {
      const { data } = await api.get("/empleados");
      setEmpleados(data);
    } catch {
      setError("Error al cargar los empleados.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  // ── Filtrar por búsqueda ─────────────────────────────────
  const empleadosFiltrados = empleados.filter((e) => {
    const texto = busqueda.toLowerCase();
    return (
      e.nombres?.toLowerCase().includes(texto) ||
      e.apellidos?.toLowerCase().includes(texto) ||
      e.correo?.toLowerCase().includes(texto)
    );
  });

  // ── Abrir modal crear ────────────────────────────────────
  const abrirCrear = () => {
    setForm(FORM_INICIAL);
    setModoEdicion(false);
    setSeleccionado(null);
    setError("");
    setModalForm(true);
  };

  // ── Abrir modal editar ───────────────────────────────────
  const abrirEditar = (fila) => {
    setForm({
      nombres: fila.nombres || "",
      apellidos: fila.apellidos || "",
      correo: fila.correo || "",
      numero: fila.numero || "",
      fecha_ingreso: fila.fecha_ingreso ? fila.fecha_ingreso.split("T")[0] : "",
    });
    setSeleccionado(fila);
    setModoEdicion(true);
    setError("");
    setModalForm(true);
  };

  // ── Abrir modal eliminar ─────────────────────────────────
  const abrirEliminar = (fila) => {
    setSeleccionado(fila);
    setModalEliminar(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // ── Validación ───────────────────────────────────────────
  const validar = () => {
    if (!form.nombres.trim()) return "El nombre es obligatorio.";
    if (!form.apellidos.trim()) return "El apellido es obligatorio.";
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      return "El correo no tiene un formato válido.";
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
        await api.put(`/empleados/${seleccionado.id_empleado}`, form);
      } else {
        await api.post("/empleados", form);
      }
      setModalForm(false);
      cargarEmpleados();
    } catch {
      setError("Error al guardar el empleado. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  // ── Eliminar ─────────────────────────────────────────────
  const handleEliminar = async () => {
    setEliminando(true);
    try {
      await api.delete(`/empleados/${seleccionado.id_empleado}`);
      setModalEliminar(false);
      cargarEmpleados();
    } catch {
      setError(
        "No se puede eliminar el empleado porque tiene un usuario asociado.",
      );
      setModalEliminar(false);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <Layout titulo="Empleados">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="fw-bold mb-0">Empleados</h5>
          <p className="text-muted small mb-0">
            Gestión del personal del restaurante
          </p>
        </div>
        <button
          className="btn btn-danger btn-sm d-flex align-items-center gap-2"
          onClick={abrirCrear}
        >
          <i className="bi bi-person-plus" />
          Nuevo empleado
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

      {/* Buscador */}
      <div className="mb-3" style={{ maxWidth: "340px" }}>
        <div className="input-group input-group-sm">
          <span className="input-group-text bg-white">
            <i className="bi bi-search text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Buscar por nombre, apellido o correo..."
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
      </div>

      {/* Tabla */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Tabla
            columnas={COLUMNAS}
            datos={empleadosFiltrados}
            cargando={cargando}
            onEditar={abrirEditar}
            onEliminar={abrirEliminar}
            mensajeVacio={
              busqueda
                ? `Sin resultados para "${busqueda}".`
                : "No hay empleados registrados."
            }
          />
        </div>
      </div>

      {/* ── Modal formulario ── */}
      <Modal
        show={modalForm}
        onClose={() => setModalForm(false)}
        titulo={modoEdicion ? "Editar empleado" : "Nuevo empleado"}
        onConfirmar={handleGuardar}
        textoConfirmar={modoEdicion ? "Actualizar" : "Guardar"}
        cargando={guardando}
      >
        {error && (
          <div className="alert alert-danger py-2 small mb-3">{error}</div>
        )}

        <div className="row g-2 mb-3">
          <div className="col-6">
            <label className="form-label fw-semibold">Nombres *</label>
            <input
              name="nombres"
              type="text"
              className="form-control"
              placeholder="Ej: Juan Carlos"
              value={form.nombres}
              onChange={handleChange}
            />
          </div>
          <div className="col-6">
            <label className="form-label fw-semibold">Apellidos *</label>
            <input
              name="apellidos"
              type="text"
              className="form-control"
              placeholder="Ej: Pérez López"
              value={form.apellidos}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">
            Correo
            <span className="text-muted fw-normal ms-1">(opcional)</span>
          </label>
          <input
            name="correo"
            type="email"
            className="form-control"
            placeholder="correo@ejemplo.com"
            value={form.correo}
            onChange={handleChange}
          />
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label className="form-label fw-semibold">
              Teléfono
              <span className="text-muted fw-normal ms-1">(opcional)</span>
            </label>
            <input
              name="numero"
              type="tel"
              className="form-control"
              placeholder="Ej: 987654321"
              value={form.numero}
              onChange={handleChange}
            />
          </div>
          <div className="col-6">
            <label className="form-label fw-semibold">
              Fecha de ingreso
              <span className="text-muted fw-normal ms-1">(opcional)</span>
            </label>
            <input
              name="fecha_ingreso"
              type="date"
              className="form-control"
              value={form.fecha_ingreso}
              onChange={handleChange}
            />
          </div>
        </div>
      </Modal>

      {/* ── Modal confirmar eliminar ── */}
      <Modal
        show={modalEliminar}
        onClose={() => setModalEliminar(false)}
        titulo="Eliminar empleado"
        onConfirmar={handleEliminar}
        textoConfirmar="Eliminar"
        variante="danger"
        cargando={eliminando}
      >
        <p className="mb-0">
          ¿Seguro que deseas eliminar a{" "}
          <strong>
            {seleccionado?.nombres} {seleccionado?.apellidos}
          </strong>
          ?
          <br />
          <span className="text-muted small">
            Si tiene un usuario asociado, no se podrá eliminar.
          </span>
        </p>
      </Modal>
    </Layout>
  );
}
