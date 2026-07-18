// Tabla.js — componente reutilizable para todas las páginas
//
// Props:
//   columnas  → array de { label, key } donde key es el campo del objeto
//   datos     → array de objetos a mostrar
//   onEditar  → función(fila) — si se pasa, muestra botón Editar
//   onEliminar→ función(fila) — si se pasa, muestra botón Eliminar
//   cargando  → boolean — muestra spinner mientras carga
//   mensajeVacio → texto cuando no hay datos (opcional)
//
// Uso básico:
//   <Tabla
//     columnas={[{ label: "Nombre", key: "nombre" }, { label: "Estado", key: "estado" }]}
//     datos={insumos}
//     onEditar={(fila) => abrirModal(fila)}
//     onEliminar={(fila) => eliminar(fila.id_insumo)}
//     cargando={cargando}
//   />

export default function Tabla({
  columnas = [],
  datos = [],
  onEditar,
  onEliminar,
  cargando = false,
  mensajeVacio = "No hay registros para mostrar.",
}) {
  const tieneAcciones = onEditar || onEliminar;

  // ── Spinner de carga ──────────────────────────────────────
  if (cargando) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted mt-2 small">Cargando datos...</p>
      </div>
    );
  }

  // ── Sin datos ─────────────────────────────────────────────
  if (datos.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-inbox fs-1 d-block mb-2" />
        {mensajeVacio}
      </div>
    );
  }

  // ── Tabla ─────────────────────────────────────────────────
  return (
    <div className="table-responsive">
      <table className="table table-hover table-bordered align-middle mb-0">
        <thead className="table-dark">
          <tr>
            {columnas.map((col) => (
              <th
                key={col.key}
                className="fw-semibold"
                style={{ fontSize: "0.85rem" }}
              >
                {col.label}
              </th>
            ))}
            {tieneAcciones && (
              <th
                className="text-center fw-semibold"
                style={{ fontSize: "0.85rem", width: "130px" }}
              >
                Acciones
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {datos.map((fila, index) => (
            <tr key={index}>
              {columnas.map((col) => (
                <td key={col.key} style={{ fontSize: "0.9rem" }}>
                  {/* Si la columna tiene un render personalizado, úsalo */}
                  {col.render
                    ? col.render(fila[col.key], fila)
                    : (fila[col.key] ?? "—")}
                </td>
              ))}

              {tieneAcciones && (
                <td className="text-center">
                  <div className="d-flex gap-1 justify-content-center">
                    {onEditar && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onEditar(fila)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil" />
                      </button>
                    )}
                    {onEliminar && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onEliminar(fila)}
                        title="Eliminar"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
