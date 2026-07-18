import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Tabla from "../components/Tabla";
import api from "../services/api";
import { useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLUMNAS_MERMAS = [
  { label: "Insumo", key: "nombre" },
  { label: "Total merma", key: "total_merma" },
  { label: "Registros", key: "cantidad_registros" },
];

const COLUMNAS_MOVIMIENTOS = [
  {
    label: "Tipo",
    key: "tipo",
    render: (val) => {
      const config = {
        ingreso: { bg: "primary", label: "Ingreso" },
        apertura: { bg: "info", label: "Apertura" },
        preparacion: { bg: "warning", label: "Preparación" },
        salida: { bg: "secondary", label: "Salida" },
        merma: { bg: "danger", label: "Merma" },
      };
      const c = config[val] ?? { bg: "secondary", label: val };
      return (
        <span
          className={`badge bg-${c.bg} text-${c.bg === "warning" ? "dark" : "white"}`}
        >
          {c.label}
        </span>
      );
    },
  },
  { label: "Total registros", key: "total_registros" },
  { label: "Total cantidad", key: "total_cantidad" },
];

export default function Reportes() {
  const [resumen, setResumen] = useState(null);
  const [mermas, setMermas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  //pdf
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const descargarPDF = () => {
    setGenerandoPDF(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const anchoPagina = pdf.internal.pageSize.getWidth();
      const fecha = new Date().toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      // ── Encabezado ──
      pdf.setFillColor(220, 38, 38); // rojo KFC
      pdf.rect(0, 0, anchoPagina, 28, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Reporte de Inventario - KFC", 14, 14);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generado el ${fecha}`, 14, 21);

      let posY = 38;

      // ── Sección: Resumen de lotes ──
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text("Resumen de lotes", 14, posY);
      posY += 6;

      const filasResumen = [
        ["Total lotes", resumen?.total_lotes ?? 0],
        ["Activos", resumen?.activos ?? 0],
        ["Vencidos", resumen?.vencidos ?? 0],
        ["Consumidos", resumen?.consumidos ?? 0],
        ["Stock total", `${resumen?.stock_total ?? 0} unidades`],
        ["Próx. a vencer (3 días)", resumen?.proximos_a_vencer ?? 0],
      ];

      autoTable(pdf, {
        startY: posY,
        head: [["Indicador", "Valor"]],
        body: filasResumen,
        theme: "grid",
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 10, cellPadding: 3 },
        margin: { left: 14, right: 14 },
      });

      posY = pdf.lastAutoTable.finalY + 12;

      // ── Sección: Mermas por insumo ──
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text("Mermas por insumo", 14, posY);
      posY += 6;

      if (mermas.length > 0) {
        autoTable(pdf, {
          startY: posY,
          head: [["Insumo", "Total merma", "Registros"]],
          body: mermas.map((m) => [
            m.nombre,
            m.total_merma,
            m.cantidad_registros,
          ]),
          theme: "grid",
          headStyles: {
            fillColor: [220, 38, 38],
            textColor: 255,
            fontStyle: "bold",
          },
          styles: { fontSize: 10, cellPadding: 3 },
          margin: { left: 14, right: 14 },
        });
        posY = pdf.lastAutoTable.finalY + 12;
      } else {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(120, 120, 120);
        pdf.text("No hay mermas registradas.", 14, posY);
        pdf.setTextColor(0, 0, 0);
        posY += 12;
      }

      // Si no cabe la siguiente tabla en la página, salta a una nueva
      if (posY > 240) {
        pdf.addPage();
        posY = 20;
      }

      // ── Sección: Movimientos por tipo ──
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text("Movimientos por tipo", 14, posY);
      posY += 6;

      const etiquetasTipo = {
        ingreso: "Ingreso",
        apertura: "Apertura",
        preparacion: "Preparación",
        salida: "Salida",
        merma: "Merma",
      };

      if (movimientos.length > 0) {
        autoTable(pdf, {
          startY: posY,
          head: [["Tipo", "Total registros", "Total cantidad"]],
          body: movimientos.map((m) => [
            etiquetasTipo[m.tipo] ?? m.tipo,
            m.total_registros,
            m.total_cantidad,
          ]),
          theme: "grid",
          headStyles: {
            fillColor: [220, 38, 38],
            textColor: 255,
            fontStyle: "bold",
          },
          styles: { fontSize: 10, cellPadding: 3 },
          margin: { left: 14, right: 14 },
        });
      } else {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(120, 120, 120);
        pdf.text("No hay movimientos registrados.", 14, posY);
      }

      // ── Pie de página con número de página ──
      const totalPaginas = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Página ${i} de ${totalPaginas} — Sistema de Inventario KFC`,
          14,
          pdf.internal.pageSize.getHeight() - 10,
        );
      }

      const fechaArchivo = new Date()
        .toLocaleDateString("es-PE")
        .replace(/\//g, "-");
      pdf.save(`Reporte_Inventario_KFC_${fechaArchivo}.pdf`);
    } catch (err) {
      console.error("Error al generar el PDF:", err);
      setError("No se pudo generar el PDF. Intenta de nuevo.");
    } finally {
      setGenerandoPDF(false);
    }
  };

  // ── Cargar todos los reportes en paralelo ────────────────
  const cargarReportes = async () => {
    setCargando(true);
    setError("");
    try {
      const [resRes, resMer, resMov] = await Promise.all([
        api.get("/reportes"),
        api.get("/reportes/mermas"),
        api.get("/reportes/movimientos"),
      ]);
      setResumen(resRes.data);
      setMermas(resMer.data);
      setMovimientos(resMov.data);
    } catch {
      setError("Error al cargar los reportes.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  return (
    <Layout titulo="Reportes">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-0">Reportes</h5>
          <p className="text-muted small mb-0">
            Resumen general del inventario
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
            onClick={cargarReportes}
            disabled={cargando}
          >
            <i className={`bi bi-arrow-clockwise ${cargando ? "spin" : ""}`} />
            Actualizar
          </button>
          <button
            className="btn btn-danger btn-sm d-flex align-items-center gap-2"
            onClick={descargarPDF}
            disabled={cargando || generandoPDF}
          >
            <i
              className={`bi ${generandoPDF ? "bi-hourglass-split" : "bi-file-earmark-pdf"}`}
            />
            {generandoPDF ? "Generando..." : "Descargar PDF"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
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

      {/* ── Sección 1: Cards de resumen ── */}
      <p
        className="fw-semibold text-muted small text-uppercase mb-2"
        style={{ letterSpacing: ".05em" }}
      >
        Resumen de lotes
      </p>
      {cargando ? (
        <div className="text-center py-4">
          <div className="spinner-border text-danger" role="status" />
        </div>
      ) : (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-4 col-xl-2">
            <Card
              titulo="Total lotes"
              valor={resumen?.total_lotes ?? 0}
              icono="bi bi-layers"
              variante="primary"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-2">
            <Card
              titulo="Activos"
              valor={resumen?.activos ?? 0}
              icono="bi bi-check-circle"
              variante="success"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-2">
            <Card
              titulo="Vencidos"
              valor={resumen?.vencidos ?? 0}
              icono="bi bi-x-circle"
              variante="danger"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-2">
            <Card
              titulo="Consumidos"
              valor={resumen?.consumidos ?? 0}
              icono="bi bi-archive"
              variante="secondary"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-2">
            <Card
              titulo="Stock total"
              valor={resumen?.stock_total ?? 0}
              icono="bi bi-box-seam"
              variante="primary"
              subtitulo="unidades"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-2">
            <Card
              titulo="Próx. a vencer"
              valor={resumen?.proximos_a_vencer ?? 0}
              icono="bi bi-clock-history"
              variante="warning"
              subtitulo="en 3 días"
            />
          </div>
        </div>
      )}

      {/* ── Sección 2: Mermas por insumo + Movimientos ── */}
      <div className="row g-4">
        {/* Mermas */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold small">
                <i className="bi bi-exclamation-triangle text-danger me-2" />
                Mermas por insumo
              </span>
              <span className="badge bg-secondary">{mermas.length}</span>
            </div>
            <div className="card-body p-0">
              <Tabla
                columnas={COLUMNAS_MERMAS}
                datos={mermas}
                cargando={cargando}
                mensajeVacio="No hay mermas registradas."
              />
            </div>
          </div>
        </div>

        {/* Movimientos por tipo */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold small">
                <i className="bi bi-arrow-left-right text-primary me-2" />
                Movimientos por tipo
              </span>
              <span className="badge bg-secondary">{movimientos.length}</span>
            </div>
            <div className="card-body p-0">
              <Tabla
                columnas={COLUMNAS_MOVIMIENTOS}
                datos={movimientos}
                cargando={cargando}
                mensajeVacio="No hay movimientos registrados."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estilos animación recarga */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { display: inline-block; animation: spin 1s linear infinite; }
      `}</style>
    </Layout>
  );
}
