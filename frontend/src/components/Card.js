// Card.js — tarjeta de estadística para los dashboards
//
// Props:
//   titulo  → string — etiqueta de la métrica  ("Total lotes", "Vencidos"...)
//   valor   → string | number — el número principal a mostrar
//   icono   → string — clase de Bootstrap Icons  ("bi bi-box-seam")
//   variante→ color de acento: "danger" | "success" | "warning" | "primary" | "secondary"
//   subtitulo → texto pequeño debajo del valor (opcional)
//
// Uso en un dashboard:
//   <Card titulo="Lotes activos"  valor={32} icono="bi bi-layers"    variante="success" />
//   <Card titulo="Vencidos"       valor={4}  icono="bi bi-x-circle"  variante="danger"  />
//   <Card titulo="Stock total"    valor={180} icono="bi bi-box-seam" variante="primary" subtitulo="unidades en inventario" />

const COLORES = {
  danger: { bg: "#fff5f5", icono: "#e4002b", borde: "#fecaca" },
  success: { bg: "#f0fdf4", icono: "#16a34a", borde: "#bbf7d0" },
  warning: { bg: "#fffbeb", icono: "#d97706", borde: "#fde68a" },
  primary: { bg: "#eff6ff", icono: "#2563eb", borde: "#bfdbfe" },
  secondary: { bg: "#f8fafc", icono: "#64748b", borde: "#e2e8f0" },
};

export default function Card({
  titulo = "Métrica",
  valor = 0,
  icono = "bi bi-bar-chart",
  variante = "primary",
  subtitulo = "",
}) {
  const color = COLORES[variante] ?? COLORES.primary;

  return (
    <div
      className="rounded-3 p-3 h-100"
      style={{
        backgroundColor: color.bg,
        border: `1px solid ${color.borde}`,
      }}
    >
      <div className="d-flex align-items-start justify-content-between">
        {/* Texto */}
        <div>
          <p
            className="mb-1 fw-semibold text-muted"
            style={{
              fontSize: "0.78rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {titulo}
          </p>
          <p
            className="mb-0 fw-bold"
            style={{ fontSize: "2rem", lineHeight: 1, color: "#111827" }}
          >
            {valor}
          </p>
          {subtitulo && (
            <p className="mb-0 mt-1 text-muted" style={{ fontSize: "0.78rem" }}>
              {subtitulo}
            </p>
          )}
        </div>

        {/* Ícono */}
        <div
          className="rounded-3 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: color.icono,
            width: "44px",
            height: "44px",
            flexShrink: 0,
          }}
        >
          <i className={icono} style={{ fontSize: "1.25rem", color: "#fff" }} />
        </div>
      </div>
    </div>
  );
}
