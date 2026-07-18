import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Tabla from "../components/Tabla";
import Modal from "../components/Modal";
import api from "../services/api";

const FORM_INICIAL = {
  id_empleado: "",
  username: "",
  password: "",
  id_rol: "",
};

const COLUMNAS = [
  { label: "ID", key: "id_usuario" },
  {
    label: "Empleado",
    key: "nombres",
    render: (val, fila) => `${val} ${fila.apellidos}`,
  },
  { label: "Usuario", key: "username" },
  {
    label: "Roles",
    key: "roles",
    render: (val) =>
      val ? (
        val.split(", ").map((r) => (
          <span key={r} className="badge bg-secondary me-1">
            {r}
          </span>
        ))
      ) : (
        <span className="text-muted small">Sin rol</span>
      ),
  },
  {
    label: "Estado",
    key: "estado",
    render: (val) => (
      <span className={`badge bg-${val === "activo" ? "success" : "danger"}`}>
        {val === "activo" ? "Activo" : "Inactivo"}
      </span>
    ),
  },
];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [modalForm, setModalForm] = useState(false);
  const [modalEstado, setModalEstado] = useState(false);
  const [modalRol, setModalRol] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [rolAsignar, setRolAsignar] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // ── Cargar datos ─────────────────────────────────────────
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resUsu, resEmp, resRol] = await Promise.all([
        api.get("/usuarios"),
        api.get("/empleados"),
        api.get("/roles"),
      ]);
      setUsuarios(resUsu.data);
      setEmpleados(resEmp.data);
      setRoles(resRol.data);
    } catch {
      setError("Error al cargar los datos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ── Filtrar por búsqueda ─────────────────────────────────
  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = busqueda.toLowerCase();
    return (
      u.username?.toLowerCase().includes(texto) ||
      u.nombres?.toLowerCase().includes(texto) ||
      u.apellidos?.toLowerCase().includes(texto)
    );
  });

  // ── Abrir modal crear ────────────────────────────────────
  const abrirCrear = () => {
    setForm(FORM_INICIAL);
    setError("");
    setModalForm(true);
  };

  // ── Abrir modal cambiar estado ───────────────────────────
  const abrirCambiarEstado = (fila) => {
    setSeleccionado(fila);
    setModalEstado(true);
  };

  // ── Abrir modal asignar rol ──────────────────────────────
  const abrirAsignarRol = (fila) => {
    setSeleccionado(fila);
    setRolAsignar("");
    setError("");
    setModalRol(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // ── Validación ───────────────────────────────────────────
  const validar = () => {
    if (!form.id_empleado) return "Selecciona un empleado.";
    if (!form.username.trim()) return "El nombre de usuario es obligatorio.";
    if (form.username.length < 3)
      return "El usuario debe tener al menos 3 caracteres.";
    if (!form.password.trim()) return "La contraseña es obligatoria.";
    if (form.password.length < 4)
      return "La contraseña debe tener al menos 4 caracteres.";
    if (!form.id_rol) return "Asigna al menos un rol al usuario.";
    return "";
  };

  // ── Crear usuario + asignar rol en un solo flujo ─────────
  const handleGuardar = async () => {
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    setGuardando(true);
    setError("");
    try {
      // 1. Crear usuario
      const { data } = await api.post("/usuarios", {
        id_empleado: Number(form.id_empleado),
        username: form.username,
        password: form.password,
      });

      // 2. Asignar rol inmediatamente
      await api.post("/usuario-rol", {
        id_usuario: data.id,
        id_rol: Number(form.id_rol),
      });

      setModalForm(false);
      cargarDatos();
    } catch (err) {
      // Username duplicado → MySQL error 1062
      if (err.response?.data?.code === "ER_DUP_ENTRY") {
        setError("Ese nombre de usuario ya está en uso.");
      } else {
        setError("Error al crear el usuario. Intenta de nuevo.");
      }
    } finally {
      setGuardando(false);
    }
  };

  // ── Cambiar estado activo / inactivo ─────────────────────
  const handleCambiarEstado = async () => {
    const nuevoEstado =
      seleccionado.estado === "activo" ? "inactivo" : "activo";
    setGuardando(true);
    try {
      await api.put(`/usuarios/${seleccionado.id_usuario}/estado`, {
        estado: nuevoEstado,
      });
      setModalEstado(false);
      cargarDatos();
    } catch {
      setError("Error al cambiar el estado.");
      setModalEstado(false);
    } finally {
      setGuardando(false);
    }
  };

  // ── Asignar rol adicional ────────────────────────────────
  const handleAsignarRol = async () => {
    if (!rolAsignar) {
      setError("Selecciona un rol.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await api.post("/usuario-rol", {
        id_usuario: seleccionado.id_usuario,
        id_rol: Number(rolAsignar),
      });
      setModalRol(false);
      cargarDatos();
    } catch (err) {
      // PK duplicada → rol ya asignado
      if (err.response?.data?.code === "ER_DUP_ENTRY") {
        setError("Ese rol ya está asignado a este usuario.");
      } else {
        setError("Error al asignar el rol.");
      }
    } finally {
      setGuardando(false);
    }
  };

  // Columnas + acciones extra (estado y rol)
  const columnasConAcciones = [
    ...COLUMNAS,
    {
      label: "Acciones",
      key: "_acciones",
      render: (_, fila) => (
        <div className="d-flex gap-1 flex-wrap">
          <button
            className={`btn btn-sm ${
              fila.estado === "activo"
                ? "btn-outline-warning"
                : "btn-outline-success"
            }`}
            onClick={() => abrirCambiarEstado(fila)}
            title={fila.estado === "activo" ? "Desactivar" : "Activar"}
          >
            <i
              className={`bi bi-${fila.estado === "activo" ? "pause-circle" : "play-circle"}`}
            />
          </button>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => abrirAsignarRol(fila)}
            title="Asignar rol"
          >
            <i className="bi bi-shield-plus" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout titulo="Usuarios">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="fw-bold mb-0">Usuarios</h5>
          <p className="text-muted small mb-0">
            Gestión de cuentas de acceso al sistema
          </p>
        </div>
        <button
          className="btn btn-danger btn-sm d-flex align-items-center gap-2"
          onClick={abrirCrear}
        >
          <i className="bi bi-person-plus" />
          Nuevo usuario
        </button>
      </div>

      {/* Error global */}
      {error && !modalForm && !modalEstado && !modalRol && (
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
            placeholder="Buscar por usuario o nombre..."
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

      {/* Tabla — usamos columnas con acciones personalizadas */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Tabla
            columnas={columnasConAcciones}
            datos={usuariosFiltrados}
            cargando={cargando}
            mensajeVacio={
              busqueda
                ? `Sin resultados para "${busqueda}".`
                : "No hay usuarios registrados."
            }
          />
        </div>
      </div>

      {/* ── Modal crear usuario ── */}
      <Modal
        show={modalForm}
        onClose={() => setModalForm(false)}
        titulo="Nuevo usuario"
        onConfirmar={handleGuardar}
        textoConfirmar="Crear usuario"
        cargando={guardando}
      >
        {error && (
          <div className="alert alert-danger py-2 small mb-3">{error}</div>
        )}

        {/* Empleado */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Empleado *</label>
          <select
            name="id_empleado"
            className="form-select"
            value={form.id_empleado}
            onChange={handleChange}
          >
            <option value="">Selecciona un empleado...</option>
            {empleados.map((e) => (
              <option key={e.id_empleado} value={e.id_empleado}>
                {e.nombres} {e.apellidos}
              </option>
            ))}
          </select>
        </div>

        {/* Username */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Nombre de usuario *</label>
          <input
            name="username"
            type="text"
            className="form-control"
            placeholder="Ej: jperez"
            value={form.username}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Contraseña *</label>
          <input
            name="password"
            type="password"
            className="form-control"
            placeholder="Mínimo 4 caracteres"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </div>

        {/* Rol inicial */}
        <div className="mb-1">
          <label className="form-label fw-semibold">Rol *</label>
          <select
            name="id_rol"
            className="form-select"
            value={form.id_rol}
            onChange={handleChange}
          >
            <option value="">Selecciona un rol...</option>
            {roles.map((r) => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* ── Modal cambiar estado ── */}
      <Modal
        show={modalEstado}
        onClose={() => setModalEstado(false)}
        titulo={
          seleccionado?.estado === "activo"
            ? "Desactivar usuario"
            : "Activar usuario"
        }
        onConfirmar={handleCambiarEstado}
        textoConfirmar={
          seleccionado?.estado === "activo" ? "Desactivar" : "Activar"
        }
        variante={seleccionado?.estado === "activo" ? "danger" : "success"}
        cargando={guardando}
      >
        <p className="mb-0">
          ¿Seguro que deseas{" "}
          <strong>
            {seleccionado?.estado === "activo" ? "desactivar" : "activar"}
          </strong>{" "}
          al usuario <strong>{seleccionado?.username}</strong>?
          {seleccionado?.estado === "activo" && (
            <>
              <br />
              <span className="text-muted small">
                El usuario no podrá iniciar sesión mientras esté inactivo.
              </span>
            </>
          )}
        </p>
      </Modal>

      {/* ── Modal asignar rol adicional ── */}
      <Modal
        show={modalRol}
        onClose={() => setModalRol(false)}
        titulo={`Asignar rol a ${seleccionado?.username}`}
        onConfirmar={handleAsignarRol}
        textoConfirmar="Asignar"
        cargando={guardando}
      >
        {error && (
          <div className="alert alert-danger py-2 small mb-3">{error}</div>
        )}
        <div className="mb-1">
          <label className="form-label fw-semibold">Rol *</label>
          <select
            className="form-select"
            value={rolAsignar}
            onChange={(e) => {
              setRolAsignar(e.target.value);
              setError("");
            }}
          >
            <option value="">Selecciona un rol...</option>
            {roles.map((r) => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.nombre}
              </option>
            ))}
          </select>
          <p className="form-text mb-0">
            Los roles actuales del usuario se mantendrán.
          </p>
        </div>
      </Modal>
    </Layout>
  );
}
