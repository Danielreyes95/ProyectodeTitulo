const Pago = require("../models/pago.model");
const Jugador = require("../models/jugador.model");
const Apoderado = require("../models/apoderado.model");
const Categoria = require("../models/categoria.model");

/* ============================================================
   NORMALIZAR ESTADO
=============================================================== */
function normalizarEstado(estado) {
  if (!estado) return "pendiente";
  return estado.toLowerCase();
}

/* ============================================================
   🟢 REGISTRAR PAGO
=============================================================== */
exports.registrarPago = async (req, res) => {
  try {
    const { jugadorId, mes, monto, metodoPago, observacion } = req.body;

    const jugador = await Jugador.findById(jugadorId).populate("apoderado categoria");
    if (!jugador)
      return res.status(404).json({ error: "Jugador no encontrado" });

    const pagoExistente = await Pago.findOne({ jugador: jugadorId, mes });
    if (pagoExistente) {
      return res.status(400).json({
        error: "El jugador ya tiene un pago registrado en este mes."
      });
    }

    const nuevoPago = await Pago.create({
      jugador: jugadorId,
      apoderado: jugador.apoderado?._id || null,
      categoria: jugador.categoria?._id || null,
      mes,
      monto,
      metodoPago,
      plataforma: metodoPago === "App" ? "App" : "Manual",
      estado: "Pagado",
      fechaPago: new Date(),
      observacion
    });

    res.json({
      mensaje: "Pago registrado correctamente",
      pago: nuevoPago
    });

  } catch (error) {
    res.status(500).json({
      error: "Error al registrar pago",
      detalle: error.message
    });
  }
};


/* ============================================================
   🟠 ACTUALIZAR ESTADO
=============================================================== */
exports.actualizarEstadoPago = async (req, res) => {
  try {
    const { estado, observacion } = req.body;

    const estadoNormalizado = normalizarEstado(estado);

    const pago = await Pago.findByIdAndUpdate(
      req.params.id,
      {
        estado: estadoNormalizado,
        observacion,
        fechaPago: estadoNormalizado === "pagado" ? new Date() : null
      },
      { new: true }
    );

    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });

    res.json({ mensaje: "Estado actualizado", pago });

  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar pago",
      detalle: error.message
    });
  }
};

/* ============================================================
   🟣 EDITAR PAGO
=============================================================== */
exports.editarPago = async (req, res) => {
  try {
    const pago = await Pago.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });

    res.json({ mensaje: "Pago actualizado", pago });

  } catch (error) {
    res.status(500).json({
      error: "Error al editar pago",
      detalle: error.message
    });
  }
};

/* ============================================================
   🟣 ELIMINAR PAGO
=============================================================== */
exports.eliminarPago = async (req, res) => {
  try {
    const pago = await Pago.findByIdAndDelete(req.params.id);

    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });

    res.json({ mensaje: "Pago eliminado" });

  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar pago",
      detalle: error.message
    });
  }
};

/* ============================================================
   🟡 HISTORIAL POR JUGADOR
=============================================================== */
exports.historialJugador = async (req, res) => {
  try {
    const pagos = await Pago.find({ jugador: req.params.jugadorId })
      .sort({ fechaPago: -1 });

    const historial = pagos.map(p => ({
      fechaPago: p.fechaPago,
      mes: p.mes,
      monto: p.monto,
      metodoPago: p.metodoPago,
      observacion: p.observacion
    }));

    res.json(historial);

  } catch (error) {
    res.status(500).json({
      error: "Error al obtener historial",
      detalle: error.message
    });
  }
};

/* ============================================================
   🟣 PAGOS POR JUGADOR (Optimizado para panel jugador)
=============================================================== */
exports.obtenerPagosPorJugador = async (req, res) => {
  try {
    const pagos = await Pago.find({ jugador: req.params.jugadorId })
      .sort({ fechaPago: -1 });

    const detalle = pagos.map(p => ({
      mes: p.mes,
      monto: p.monto,
      metodoPago: p.metodoPago,
      estado: p.estado,
      fechaPago: p.fechaPago,
      observacion: p.observacion
    }));

    res.json(detalle);

  } catch (error) {
    res.status(500).json({
      error: "Error al obtener pagos del jugador",
      detalle: error.message
    });
  }
};

/* ============================================================
   🟣 PAGOS POR CATEGORÍA (Directores)
=============================================================== */
exports.obtenerPagosPorCategoria = async (req, res) => {
  try {
    const pagos = await Pago.find({ categoria: req.params.categoriaId })
      .populate("jugador", "nombre rut")
      .populate("apoderado", "nombre correo")
      .sort({ createdAt: -1 });

    res.json({ pagos });

  } catch (error) {
    res.status(500).json({
      error: "Error al obtener pagos por categoría",
      detalle: error.message
    });
  }
};

/* ============================================================
   🟩 RESUMEN MENSUAL (Vista del director)
=============================================================== */
exports.resumenPagos = async (req, res) => {
  try {
    const { mes, categoriaId } = req.query;

    if (!mes) {
      return res.status(400).json({
        error: "Debes enviar mes (Ej: 'Noviembre 2025')"
      });
    }

    const filtroCategoria =
      categoriaId && categoriaId !== "todas"
        ? { categoria: categoriaId }
        : {};

    const jugadores = await Jugador
      .find(filtroCategoria)
      .populate("categoria", "nombre");

    const pagosMes = await Pago.find({ mes });

    const MESES_CORTO = [
      "Ene","Feb","Mar","Abr","May","Jun",
      "Jul","Ago","Sep","Oct","Nov","Dic"
    ];

    function formatearInscripcion(fecha) {
      if (!fecha) return "—";
      const f = new Date(fecha);
      return `${MESES_CORTO[f.getMonth()]}/${f.getFullYear()}`;
    }

    let pagados = 0;
    let pendientes = 0;
    let atrasados = 0;

    const detalle = jugadores.map(j => {
      const pago = pagosMes.find(p =>
        String(p.jugador) === String(j._id)
      );

      const estado = pago ? normalizarEstado(pago.estado) : "pendiente";

      if (estado === "pagado") pagados++;
      else if (estado === "atrasado") atrasados++;
      else pendientes++;

      return {
        jugadorId: j._id,
        nombre: j.nombre,
        rut: j.rut,
        categoria: j.categoria?.nombre || "Sin categoría",
        inscripcion: formatearInscripcion(j.createdAt),
        estadoPago: estado,
        pagoId: pago?._id || null,
        monto: pago?.monto || 0,
        fechaPago: pago?.fechaPago || null,
        metodoPago: pago?.metodoPago || null,
        observacion: pago?.observacion || null
      };
    });

    res.json({
      pagados,
      pendientes,
      atrasados,
      montoTotal: detalle.reduce(
        (acc, j) => j.estadoPago === "pagado" ? acc + j.monto : acc,
        0
      ),
      jugadores: detalle
    });

  } catch (error) {
    res.status(500).json({
      error: "Error en resumen",
      detalle: error.message
    });
  }
};

/* ============================================================
   🟦 REPORTE DE PAGOS
=============================================================== */
exports.reportePagos = async (req, res) => {
  try {
    const { mes, anyo, categoriaId } = req.query;

    let filtro = {};
    if (categoriaId && categoriaId !== "") {
      filtro.categoria = categoriaId;
    }

    const jugadores = await Jugador.find(filtro)
      .populate("categoria", "nombre");

    let pagos = await Pago.find()
      .populate("jugador", "nombre rut")
      .populate("categoria", "nombre");

    pagos = pagos.map(p => {
      p.estado = normalizarEstado(p.estado);
      return p;
    });

    const MESES = {
      "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
      "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
      "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12
    };

    function parsearMes(rawMes) {
      if (!rawMes) return null;
      rawMes = rawMes.toLowerCase().trim();

      if (/^\d{4}-\d{2}$/.test(rawMes)) {
        const [anio, mesNum] = rawMes.split("-");
        return { mesNum: parseInt(mesNum), anio: parseInt(anio) };
      }

      const partes = rawMes.split(" ");
      if (partes.length === 2) {
        const mesNum = MESES[partes[0]];
        const anio = parseInt(partes[1]);
        if (mesNum) return { mesNum, anio };
      }

      return null;
    }

    if (mes || anyo) {
      pagos = pagos.filter(p => {
        const fecha = parsearMes(p.mes);
        if (!fecha) return false;

        if (mes && anyo)
          return fecha.mesNum === parseInt(mes) && fecha.anio === parseInt(anyo);

        if (mes && !anyo)
          return fecha.mesNum === parseInt(mes);

        if (!mes && anyo)
          return fecha.anio === parseInt(anyo);

        return true;
      });
    }

    const detalle = jugadores.map(j => {
      const pago = pagos.find(p => String(p.jugador._id) === String(j._id));

      return {
        jugadorId: j._id,
        nombre: j.nombre,
        rut: j.rut,
        categoria: j.categoria?.nombre || "Sin categoría",
        estado: pago ? pago.estado : "pendiente",
        monto: pago?.monto || 0,
        mes: pago?.mes || "-",
        fechaPago: pago?.fechaPago || null
      };
    });

    const pagados = detalle.filter(x => x.estado === "pagado").length;
    const pendientes = detalle.filter(x => x.estado === "pendiente").length;
    const atrasados = detalle.filter(x => x.estado === "atrasado").length;

    res.json({
      total: detalle.length,
      pagados,
      pendientes,
      atrasados,
      detalle
    });

  } catch (error) {
    res.status(500).json({
      error: "Error en reporte de pagos",
      detalle: error.message
    });
  }
};

/* ============================================================
   🟢 MESES ASOCIADOS A LA CUENTA DEL JUGADOR
=============================================================== */
exports.mesesJugador = async (req, res) => {
  try {
    const jugadorId = req.params.jugadorId;

    const jugador = await Jugador.findById(jugadorId);
    if (!jugador)
      return res.status(404).json({ error: "Jugador no encontrado" });

    const MESES = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const creado = new Date(jugador.createdAt);
    const añoActual = new Date().getFullYear();

    let meses = [];

    // Mes desde creación → diciembre del mismo año
    for (let m = creado.getMonth(); m < 12; m++) {
      meses.push({ mes: MESES[m], anio: creado.getFullYear() });
    }

    // Si la cuenta tiene más de un año → agregar año actual completo
    if (creado.getFullYear() < añoActual) {
      for (let m = 0; m < 12; m++) {
        meses.push({ mes: MESES[m], anio: añoActual });
      }
    }

    // Obtener pagos existentes
    const pagos = await Pago.find({ jugador: jugadorId });

    const resultado = meses.map(m => {
      const key = `${m.mes} ${m.anio}`;
      const pago = pagos.find(p => p.mes === key);

      return {
        mes: m.mes,
        anio: m.anio,
        pagado: !!pago,
        fechaPago: pago?.fechaPago || null
      };
    });

    res.json({ meses: resultado });

  } catch (error) {
    res.status(500).json({
      error: "Error al obtener meses del jugador",
      detalle: error.message
    });
  }
};
