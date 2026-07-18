import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

// Layout base para todas las páginas autenticadas.
// Uso:
//   <Layout titulo="Insumos">
//     <MiContenido />
//   </Layout>
export default function Layout({ titulo, children }) {
  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Área principal */}
      <div className="d-flex flex-column flex-grow-1 bg-light">
        {/* Navbar superior */}
        <Navbar titulo={titulo} />

        {/* Contenido de la página */}
        <main className="p-4 flex-grow-1">{children}</main>
      </div>
    </div>
  );
}
