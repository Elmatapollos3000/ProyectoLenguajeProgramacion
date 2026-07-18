import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Tabla from "../components/Tabla";
import Modal from "../components/Modal";
import api from "../services/api";

const FORM_INICIAL = { nombre: "" };

const COLUMNAS = [
  { label: "ID", key: "id_rol" },
  { label: "Nombre", key: "nombre" },
];

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");
  const [modalForm, setModalForm] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);

  // ── Cargar roles ─────────────────────────────────────────
  const cargarRoles = async () => {
    setCargando(true);
    try {
      const { data } = await api.get("/roles");
      setRoles(data);
    } catch {
      setError("Error al cargar los roles.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  // ── Abrir modal crear ────────────────────────────────────
  const abrirCrear = () => {
    setForm(FORM_INICIAL);
    setError("");
    setModalForm(true);
  };

  // ── Abrir modal eliminar ─────────────────────────────────
  const abrirEliminar = (fila) => {
    setSeleccionado(fila);
    setModalEliminar(true);
  };

  const handleChange = (e) => {
    setForm({ nombre: e.target.value });
    setError("");
  };

  // ── Validación ───────────────────────────────────────────
  const validar = () => {
    if (!form.nombre.trim()) return "El nombre del rol es obligatorio.";
    if (
      roles.some(
        (r) => r.nombre.toLowerCase() === form.nombre.trim().toLowerCase(),
      )
    )
      return "Ya existe un rol con ese nombre.";
    return "";
  };

  // ── Crear rol ────────────────────────────────────────────
  const handleGuardar = async () => {
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    setGuardando(true);
    setError("");
    try {
      await api.post("/roles", { nombre: form.nombre.trim() });
      setModalForm(false);
      cargarRoles();
    } catch {
      setError("Error al crear el rol. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  // ── Eliminar rol ─────────────────────────────────────────
  const handleEliminar = async () => {
    setEliminando(true);
    try {
      await api.delete(`/roles/${seleccionado.id_rol}`);
      setModalEliminar(false);
      cargarRoles();
    } catch {
      setError(
        "No se puede eliminar el rol porque está asignado a uno o más usuarios.",
      );
      setModalEliminar(false);
    } finally {
      setEliminando(false);
    }
  };

  // Roles base que no se deben eliminar
  const ROLES_BASE = ["Administrador", "Asistente", "Cocinero", "Auditor"];

  return (
    <Layout titulo="Roles">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="fw-bold mb-0">Roles</h5>
          <p className="text-muted small mb-0">Gestión de roles del sistema</p>
        </div>
        <button
          className="btn btn-danger btn-sm d-flex align-items-center gap-2"
          onClick={abrirCrear}
        >
          <i className="bi bi-plus-lg" />
          Nuevo rol
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

      {/* Aviso roles base */}
      <div className="alert alert-warning py-2 small mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-exclamation-triangle-fill" />
        Los roles base del sistema (
        <strong>Administrador, Asistente, Cocinero, Auditor</strong>) no deben
        eliminarse ya que controlan el acceso a los dashboards.
      </div>

      {/* Tabla */}
      <div className="card border-0 shadow-sm" style={{ maxWidth: "480px" }}>
        <div className="card-body p-0">
          <Tabla
            columnas={[
              ...COLUMNAS,
              {
                label: "Tipo",
                key: "nombre",
                render: (val) =>
                  ROLES_BASE.includes(val) ? (
                    <span className="badge bg-danger">Base</span>
                  ) : (
                    <span className="badge bg-secondary">Personalizado</span>
                  ),
              },
            ]}
            datos={roles}
            cargando={cargando}
            onEliminar={(fila) => {
              // Bloquear eliminación de roles base desde el frontend
              if (ROLES_BASE.includes(fila.nombre)) {
                setError(
                  `El rol "${fila.nombre}" es un rol base y no puede eliminarse.`,
                );
                return;
              }
              abrirEliminar(fila);
            }}
            mensajeVacio="No hay roles registrados."
          />
        </div>
      </div>

      {/* ── Modal crear rol ── */}
      <Modal
        show={modalForm}
        onClose={() => setModalForm(false)}
        titulo="Nuevo rol"
        onConfirmar={handleGuardar}
        textoConfirmar="Crear rol"
        cargando={guardando}
      >
        {error && (
          <div className="alert alert-danger py-2 small mb-3">{error}</div>
        )}
        <div className="mb-1">
          <label className="form-label fw-semibold">Nombre del rol *</label>
          <input
            name="nombre"
            type="text"
            className="form-control"
            placeholder="Ej: Supervisor"
            value={form.nombre}
            onChange={handleChange}
            autoFocus
          />
          <p className="form-text mb-0">
            El nombre debe ser único. Usa un nombre descriptivo del perfil de
            acceso.
          </p>
        </div>
      </Modal>

      {/* ── Modal confirmar eliminar ── */}
      <Modal
        show={modalEliminar}
        onClose={() => setModalEliminar(false)}
        titulo="Eliminar rol"
        onConfirmar={handleEliminar}
        textoConfirmar="Eliminar"
        variante="danger"
        cargando={eliminando}
      >
        <p className="mb-0">
          ¿Seguro que deseas eliminar el rol{" "}
          <strong>{seleccionado?.nombre}</strong>?
          <br />
          <span className="text-muted small">
            Si está asignado a algún usuario, no se podrá eliminar.
          </span>
        </p>
      </Modal>
    </Layout>
  );
}
