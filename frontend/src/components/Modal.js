import { useEffect, useRef } from "react";

// Modal.js — modal reutilizable para formularios y confirmaciones
//
// Props:
//   show      → boolean — controla si el modal es visible
//   onClose   → función — se llama al cerrar
//   titulo    → string — título del modal
//   children  → contenido del body (formulario, texto, etc.)
//   onConfirmar    → función — si se pasa, muestra botón de confirmar
//   textoConfirmar → texto del botón confirmar (default: "Guardar")
//   variante       → color del botón confirmar: "primary"|"danger"|"success" (default: "primary")
//   cargando       → boolean — deshabilita botones mientras guarda
//
// Uso para formulario:
//   <Modal
//     show={mostrarModal}
//     onClose={() => setMostrarModal(false)}
//     titulo="Nuevo insumo"
//     onConfirmar={handleGuardar}
//     cargando={guardando}
//   >
//     <input ... />
//   </Modal>
//
// Uso para confirmación de eliminación:
//   <Modal
//     show={mostrarConfirm}
//     onClose={() => setMostrarConfirm(false)}
//     titulo="Eliminar insumo"
//     onConfirmar={handleEliminar}
//     textoConfirmar="Eliminar"
//     variante="danger"
//   >
//     <p>¿Seguro que deseas eliminar <strong>{seleccionado?.nombre}</strong>?</p>
//   </Modal>

export default function Modal({
  show = false,
  onClose,
  titulo = "Modal",
  children,
  onConfirmar,
  textoConfirmar = "Guardar",
  variante = "primary",
  cargando = false,
}) {
  const dialogRef = useRef(null);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && show) onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [show, onClose]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  if (!show) return null;

  // Color del botón confirmar según variante
  const claseBoton =
    {
      primary: "btn-primary",
      danger: "btn-danger",
      success: "btn-success",
    }[variante] ?? "btn-primary";

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        style={{ zIndex: 1050 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
      >
        <div
          className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
          ref={dialogRef}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content border-0 shadow">
            {/* Header */}
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-semibold" id="modal-titulo">
                {titulo}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={cargando}
                aria-label="Cerrar"
              />
            </div>

            {/* Body */}
            <div className="modal-body">{children}</div>

            {/* Footer — solo si hay acción de confirmar */}
            {onConfirmar && (
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                  disabled={cargando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`btn ${claseBoton} btn-sm d-flex align-items-center gap-2`}
                  onClick={onConfirmar}
                  disabled={cargando}
                >
                  {cargando && (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    />
                  )}
                  {cargando ? "Guardando..." : textoConfirmar}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
