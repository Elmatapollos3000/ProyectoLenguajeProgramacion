const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ======================================
// CONEXIÓN A LA BASE DE DATOS
// ======================================
const fs = require("fs");

const conexion = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("./ca.pem"),
  },
});

conexion.connect((err) => {
  if (err) {
    console.error("Error de conexión:", err);
    return;
  }
  console.log("Conectado a la base de datos MySQL");
});

// ======================================
// UTILIDAD: registrar auditoría desde Node
// Se usa en lugar del trigger para poder
// capturar el id_usuario de la sesión.
// ======================================
function registrarAuditoria(tabla, accion, id_registro, id_usuario, cambios) {
  const sql = `
    INSERT INTO Auditoria
      (tabla, accion, id_registro, id_usuario, cambios)
    VALUES (?, ?, ?, ?, ?)
  `;
  conexion.query(
    sql,
    [tabla, accion, id_registro, id_usuario || null, cambios],
    (err) => {
      if (err) console.error("Error al registrar auditoría:", err);
    },
  );
}

// ======================================
// INSUMOS
// ======================================

// GET /api/insumos — Obtener todos los insumos
app.get("/api/insumos", (req, res) => {
  conexion.query("SELECT * FROM Insumo", (err, resultados) => {
    if (err) return res.status(500).json(err);
    res.json(resultados);
  });
});

// POST /api/insumos — Registrar nuevo insumo
app.post("/api/insumos", (req, res) => {
  const {
    nombre,
    diasBase,
    diasAbierto,
    diasPreparado,
    retirarDias,
    usaProveedor,
    usaApertura,
    usaPreparacion,
  } = req.body;

  const sql = `
    INSERT INTO Insumo (
      nombre,
      usa_fecha_proveedor,
      usa_apertura,
      usa_preparacion,
      dias_duracion_base,
      dias_duracion_abierto,
      dias_duracion_preparado,
      retirar_antes_dias
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  conexion.query(
    sql,
    [
      nombre,
      usaProveedor,
      usaApertura,
      usaPreparacion,
      diasBase,
      diasAbierto,
      diasPreparado,
      retirarDias,
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);

      registrarAuditoria(
        "Insumo",
        "INSERT",
        result.insertId,
        null,
        `Insumo creado: ${nombre}`,
      );

      res.json({ mensaje: "Insumo registrado", id: result.insertId });
    },
  );
});

// PUT /api/insumos/:id — Editar insumo existente
app.put("/api/insumos/:id", (req, res) => {
  const id = req.params.id;
  const { nombre, diasBase, diasAbierto, diasPreparado, retirarDias } =
    req.body;

  const sql = `
    UPDATE Insumo
    SET nombre              = ?,
        dias_duracion_base      = ?,
        dias_duracion_abierto   = ?,
        dias_duracion_preparado = ?,
        retirar_antes_dias      = ?
    WHERE id_insumo = ?
  `;

  conexion.query(
    sql,
    [nombre, diasBase, diasAbierto, diasPreparado, retirarDias, id],
    (err) => {
      if (err) return res.status(500).json(err);

      registrarAuditoria(
        "Insumo",
        "UPDATE",
        id,
        null,
        `Insumo actualizado: ${nombre}`,
      );

      res.json({ mensaje: "Insumo actualizado" });
    },
  );
});

// DELETE /api/insumos/:id — Eliminar insumo
app.delete("/api/insumos/:id", (req, res) => {
  const id = req.params.id;

  conexion.query("DELETE FROM Insumo WHERE id_insumo = ?", [id], (err) => {
    if (err) return res.status(500).json(err);

    registrarAuditoria("Insumo", "DELETE", id, null, "Insumo eliminado");

    res.json({ mensaje: "Insumo eliminado" });
  });
});

// ======================================
// LOTES
// ======================================

// GET /api/lotes — Listar lotes con nombre del insumo
app.get("/api/lotes", (req, res) => {
  const sql = `
    SELECT
      l.id_lote,
      i.nombre,
      l.cantidad_actual,
      l.fecha_ingreso,
      l.fecha_proveedor,
      l.fecha_apertura,
      l.fecha_vencimiento,
      l.estado
    FROM Lote l
    INNER JOIN Insumo i ON i.id_insumo = l.id_insumo
    ORDER BY l.fecha_ingreso DESC
  `;

  conexion.query(sql, (err, resultados) => {
    if (err) return res.status(500).json(err);
    res.json(resultados);
  });
});

// POST /api/lotes — Registrar nuevo lote
// El trigger trg_calcular_vencimiento_insert de la BD
// calcula automáticamente fecha_vencimiento al insertar.
app.post("/api/lotes", (req, res) => {
  const { id_insumo, cantidad, fecha_proveedor } = req.body;

  const sql = `
    INSERT INTO Lote (
      id_insumo,
      cantidad_inicial,
      cantidad_actual,
      fecha_ingreso,
      fecha_proveedor
    )
    VALUES (?, ?, ?, NOW(), ?)
  `;

  conexion.query(
    sql,
    [id_insumo, cantidad, cantidad, fecha_proveedor || null],
    (err, result) => {
      if (err) return res.status(500).json(err);

      registrarAuditoria(
        "Lote",
        "INSERT",
        result.insertId,
        null,
        `Lote creado con cantidad: ${cantidad}`,
      );

      res.json({ mensaje: "Lote registrado", id: result.insertId });
    },
  );
});

// ======================================
// MOVIMIENTOS
// ======================================

// GET /api/movimientos — Listar movimientos con nombre de insumo
app.get("/api/movimientos", (req, res) => {
  const sql = `
    SELECT
      m.*,
      i.nombre
    FROM Movimiento m
    INNER JOIN Lote l    ON l.id_lote    = m.id_lote
    INNER JOIN Insumo i  ON i.id_insumo  = l.id_insumo
    ORDER BY m.fecha DESC
  `;

  conexion.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// POST /api/movimientos — Registrar movimiento (FIFO)
// Tipos válidos: ingreso | apertura | preparacion | salida | merma
//
// Lógica por tipo:
//  - apertura    → setea fecha_apertura en el lote (dispara trigger trg_apertura
//                  que recalcula fecha_vencimiento si usa_apertura = true)
//  - salida      → descuenta cantidad_actual del lote
//  - merma       → descuenta cantidad_actual del lote
//  - preparacion → descuenta cantidad_actual del lote
//  - ingreso     → solo registra (el lote ya se crea por /api/lotes)
app.post("/api/movimientos", (req, res) => {
  const { insumoId, tipo, cantidad, id_usuario, observacion, motivo_merma } =
    req.body;

  // Buscar lote disponible por FIFO (el más antiguo con stock)
  const buscarLote = `
    SELECT id_lote, cantidad_actual
    FROM Lote
    WHERE id_insumo = ?
      AND cantidad_actual > 0
      AND estado = 'activo'
    ORDER BY fecha_ingreso ASC
    LIMIT 1
  `;

  conexion.query(buscarLote, [insumoId], (err, lotes) => {
    if (err) return res.status(500).json(err);
    if (lotes.length === 0)
      return res.status(400).json({ mensaje: "No hay stock disponible" });

    const id_lote = lotes[0].id_lote;
    const stockActual = lotes[0].cantidad_actual;

    // Validar que haya suficiente cantidad para descontar
    const tiposQueDescontan = ["salida", "merma", "preparacion"];
    if (tiposQueDescontan.includes(tipo) && cantidad > stockActual) {
      return res
        .status(400)
        .json({ mensaje: `Stock insuficiente. Disponible: ${stockActual}` });
    }

    // Insertar el movimiento
    const insertMovimiento = `
      INSERT INTO Movimiento
        (id_lote, tipo, cantidad, id_usuario, observacion, motivo_merma)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    conexion.query(
      insertMovimiento,
      [
        id_lote,
        tipo,
        cantidad,
        id_usuario || null,
        observacion || null,
        motivo_merma || null,
      ],
      (err, result) => {
        if (err) return res.status(500).json(err);

        // Apertura: actualizar fecha_apertura en el lote
        // El trigger trg_apertura recalcula fecha_vencimiento automáticamente
        if (tipo === "apertura") {
          conexion.query(
            `UPDATE Lote SET fecha_apertura = CURDATE() WHERE id_lote = ? AND fecha_apertura IS NULL`,
            [id_lote],
            (err) => {
              if (err)
                console.error("Error al actualizar fecha_apertura:", err);
            },
          );
        }

        // Salida, merma o preparacion: descontar del stock
        if (tiposQueDescontan.includes(tipo)) {
          const nuevaCantidad = stockActual - cantidad;

          conexion.query(
            `UPDATE Lote
             SET cantidad_actual = cantidad_actual - ?,
                 estado = CASE WHEN cantidad_actual - ? <= 0 THEN 'consumido' ELSE estado END
             WHERE id_lote = ?`,
            [cantidad, cantidad, id_lote],
            (err) => {
              if (err) console.error("Error al descontar stock:", err);

              // Auditoría del cambio de cantidad
              registrarAuditoria(
                "Lote",
                "UPDATE",
                id_lote,
                id_usuario,
                `Movimiento [${tipo}]: cantidad ${stockActual} -> ${nuevaCantidad}`,
              );
            },
          );
        }

        res.json({ mensaje: "Movimiento registrado", id: result.insertId });
      },
    );
  });
});

// ======================================
// PREPARACION
// ======================================

// POST /api/preparacion — Registrar preparación de insumo (FIFO)
// Usa tipo 'preparacion' en Movimiento y descuenta el stock correctamente.
app.post("/api/preparacion", (req, res) => {
  const { insumoId, cantidad, id_usuario, observacion } = req.body;

  // Buscar lote disponible por FIFO
  const buscarLote = `
    SELECT id_lote, cantidad_actual
    FROM Lote
    WHERE id_insumo = ?
      AND cantidad_actual > 0
      AND estado = 'activo'
    ORDER BY fecha_ingreso ASC
    LIMIT 1
  `;

  conexion.query(buscarLote, [insumoId], (err, lotes) => {
    if (err) return res.status(500).json(err);
    if (lotes.length === 0)
      return res.status(400).json({ mensaje: "Sin stock disponible" });

    const id_lote = lotes[0].id_lote;
    const stockActual = lotes[0].cantidad_actual;

    if (cantidad > stockActual) {
      return res
        .status(400)
        .json({ mensaje: `Stock insuficiente. Disponible: ${stockActual}` });
    }

    // Insertar movimiento de tipo preparacion
    conexion.query(
      `INSERT INTO Movimiento (id_lote, tipo, cantidad, id_usuario, observacion)
       VALUES (?, 'preparacion', ?, ?, ?)`,
      [id_lote, cantidad, id_usuario || null, observacion || null],
      (err, result) => {
        if (err) return res.status(500).json(err);

        const nuevaCantidad = stockActual - cantidad;

        // CORRECCIÓN: descontar stock del lote (bug original no hacía esto)
        conexion.query(
          `UPDATE Lote
           SET cantidad_actual = cantidad_actual - ?,
               estado = CASE WHEN cantidad_actual - ? <= 0 THEN 'consumido' ELSE estado END
           WHERE id_lote = ?`,
          [cantidad, cantidad, id_lote],
          (err) => {
            if (err)
              console.error("Error al descontar stock en preparación:", err);

            registrarAuditoria(
              "Lote",
              "UPDATE",
              id_lote,
              id_usuario,
              `Preparación: cantidad ${stockActual} -> ${nuevaCantidad}`,
            );
          },
        );

        res.json({ mensaje: "Preparación registrada", id: result.insertId });
      },
    );
  });
});

// ======================================
// EMPLEADOS
// ======================================

// GET /api/empleados — Listar todos los empleados
app.get("/api/empleados", (req, res) => {
  conexion.query("SELECT * FROM Empleado", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// POST /api/empleados — Crear empleado
app.post("/api/empleados", (req, res) => {
  const { nombres, apellidos, correo, numero, fecha_ingreso } = req.body;

  conexion.query(
    `INSERT INTO Empleado (nombres, apellidos, correo, numero, fecha_ingreso)
     VALUES (?, ?, ?, ?, ?)`,
    [nombres, apellidos, correo, numero, fecha_ingreso],
    (err, result) => {
      if (err) return res.status(500).json(err);

      registrarAuditoria(
        "Empleado",
        "INSERT",
        result.insertId,
        null,
        `Empleado creado: ${nombres} ${apellidos}`,
      );

      res.json({ mensaje: "Empleado creado", id: result.insertId });
    },
  );
});

// PUT /api/empleados/:id — Editar empleado
app.put("/api/empleados/:id", (req, res) => {
  const id = req.params.id;
  const { nombres, apellidos, correo, numero } = req.body;

  conexion.query(
    `UPDATE Empleado
     SET nombres = ?, apellidos = ?, correo = ?, numero = ?
     WHERE id_empleado = ?`,
    [nombres, apellidos, correo, numero, id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ mensaje: "Empleado actualizado" });
    },
  );
});

// DELETE /api/empleados/:id — Eliminar empleado
app.delete("/api/empleados/:id", (req, res) => {
  conexion.query(
    "DELETE FROM Empleado WHERE id_empleado = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ mensaje: "Empleado eliminado" });
    },
  );
});

// ======================================
// USUARIOS
// ======================================

// GET /api/usuarios — Listar usuarios con nombre del empleado y roles
app.get("/api/usuarios", (req, res) => {
  const sql = `
    SELECT
      u.id_usuario,
      u.username,
      u.estado,
      e.nombres,
      e.apellidos,
      GROUP_CONCAT(r.nombre SEPARATOR ', ') AS roles
    FROM Usuario u
    INNER JOIN Empleado e    ON e.id_empleado = u.id_empleado
    LEFT  JOIN Usuario_Rol ur ON ur.id_usuario = u.id_usuario
    LEFT  JOIN Rol r          ON r.id_rol      = ur.id_rol
    GROUP BY u.id_usuario
  `;

  conexion.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// POST /api/usuarios — Crear usuario
// NOTA: la contraseña llega en texto plano aquí.
// Se recomienda usar bcrypt antes de guardarla.
app.post("/api/usuarios", (req, res) => {
  const { id_empleado, username, password } = req.body;

  conexion.query(
    `INSERT INTO Usuario (id_empleado, username, password)
     VALUES (?, ?, ?)`,
    [id_empleado, username, password],
    (err, result) => {
      if (err) return res.status(500).json(err);

      registrarAuditoria(
        "Usuario",
        "INSERT",
        result.insertId,
        null,
        `Usuario creado: ${username}`,
      );

      res.json({ mensaje: "Usuario creado", id: result.insertId });
    },
  );
});

// PUT /api/usuarios/:id/estado — Activar o desactivar usuario
app.put("/api/usuarios/:id/estado", (req, res) => {
  const { estado } = req.body; // 'activo' o 'inactivo'

  conexion.query(
    `UPDATE Usuario SET estado = ? WHERE id_usuario = ?`,
    [estado, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ mensaje: `Usuario ${estado}` });
    },
  );
});

// ======================================
// ROLES
// ======================================

// GET /api/roles — Listar todos los roles
app.get("/api/roles", (req, res) => {
  conexion.query("SELECT * FROM Rol", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// POST /api/roles — Crear rol
app.post("/api/roles", (req, res) => {
  conexion.query(
    "INSERT INTO Rol (nombre) VALUES (?)",
    [req.body.nombre],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ mensaje: "Rol creado", id: result.insertId });
    },
  );
});

// DELETE /api/roles/:id — Eliminar rol
app.delete("/api/roles/:id", (req, res) => {
  conexion.query("DELETE FROM Rol WHERE id_rol = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Rol eliminado" });
  });
});

// ======================================
// ASIGNAR ROL A USUARIO
// ======================================

// POST /api/usuario-rol — Asignar un rol a un usuario
app.post("/api/usuario-rol", (req, res) => {
  const { id_usuario, id_rol } = req.body;

  conexion.query(
    `INSERT INTO Usuario_Rol (id_usuario, id_rol) VALUES (?, ?)`,
    [id_usuario, id_rol],
    (err) => {
      if (err) return res.status(500).json(err);

      registrarAuditoria(
        "Usuario_Rol",
        "INSERT",
        id_usuario,
        null,
        `Rol ${id_rol} asignado`,
      );

      res.json({ mensaje: "Rol asignado" });
    },
  );
});

// DELETE /api/usuario-rol — Quitar un rol de un usuario
app.delete("/api/usuario-rol", (req, res) => {
  const { id_usuario, id_rol } = req.body;

  conexion.query(
    `DELETE FROM Usuario_Rol WHERE id_usuario = ? AND id_rol = ?`,
    [id_usuario, id_rol],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ mensaje: "Rol removido" });
    },
  );
});

// ======================================
// LOGIN
// ======================================

// POST /api/login — Autenticar usuario
// Devuelve datos del usuario y su rol para que el
// frontend redirija al dashboard correspondiente.
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const sql = `
    SELECT
      u.id_usuario,
      u.username,
      r.nombre  AS rol,
      e.nombres,
      e.apellidos
    FROM Usuario u
    INNER JOIN Empleado    e  ON e.id_empleado = u.id_empleado
    INNER JOIN Usuario_Rol ur ON ur.id_usuario = u.id_usuario
    INNER JOIN Rol         r  ON r.id_rol      = ur.id_rol
    WHERE u.username = ?
      AND u.password = ?
      AND u.estado   = 'activo'
  `;

  conexion.query(sql, [username, password], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    }

    registrarAuditoria(
      "Usuario",
      "LOGIN",
      result[0].id_usuario,
      result[0].id_usuario,
      `Login: ${username}`,
    );

    res.json(result[0]);
  });
});

// ======================================
// AUDITORÍA
// ======================================

// GET /api/auditoria — Listar registros de auditoría
app.get("/api/auditoria", (req, res) => {
  const sql = `
    SELECT
      a.*,
      COALESCE(u.username, 'Sistema') AS usuario
    FROM Auditoria a
    LEFT JOIN Usuario u ON u.id_usuario = a.id_usuario
    ORDER BY a.fecha DESC
  `;

  conexion.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// ======================================
// REPORTES
// ======================================

// GET /api/reportes — Reporte general de inventario
app.get("/api/reportes", (req, res) => {
  const sql = `
    SELECT
      COUNT(*)                                                        AS total_lotes,
      SUM(CASE WHEN l.estado = 'vencido'   THEN 1 ELSE 0 END)       AS vencidos,
      SUM(CASE WHEN l.estado = 'consumido' THEN 1 ELSE 0 END)       AS consumidos,
      SUM(CASE WHEN l.estado = 'activo'    THEN 1 ELSE 0 END)       AS activos,
      SUM(l.cantidad_actual)                                          AS stock_total,
      SUM(CASE WHEN l.fecha_vencimiento <= CURDATE() + INTERVAL 3 DAY
               AND l.estado = 'activo'  THEN 1 ELSE 0 END)          AS proximos_a_vencer
    FROM Lote l
  `;

  conexion.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

// GET /api/reportes/mermas — Total de mermas por insumo
app.get("/api/reportes/mermas", (req, res) => {
  const sql = `
    SELECT
      i.nombre,
      SUM(m.cantidad) AS total_merma,
      COUNT(*)        AS cantidad_registros
    FROM Movimiento m
    INNER JOIN Lote   l ON l.id_lote   = m.id_lote
    INNER JOIN Insumo i ON i.id_insumo = l.id_insumo
    WHERE m.tipo = 'merma'
    GROUP BY i.id_insumo
    ORDER BY total_merma DESC
  `;

  conexion.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// GET /api/reportes/movimientos — Movimientos agrupados por tipo
app.get("/api/reportes/movimientos", (req, res) => {
  const sql = `
    SELECT
      tipo,
      COUNT(*)        AS total_registros,
      SUM(cantidad)   AS total_cantidad
    FROM Movimiento
    GROUP BY tipo
  `;

  conexion.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// ======================================
// INICIAR SERVIDOR
// ======================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
