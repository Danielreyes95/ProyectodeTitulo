const Evento = require("../models/evento.model");
const Jugador = require("../models/jugador.model");
const Categoria = require("../models/categoria.model");
const Entrenador = require("../models/entrenador.model");

/* ============================================================
   🟢 Crear evento programado (SIN asistencia inicial)
============================================================ */
exports.crearEvento = async (req, res) => {
  try {
    const { categoriaId, entrenadorId, fechaEvento, tipoEvento } = req.body;

    const categoria = await Categoria.findById(categoriaId);
    if (!categoria) return res.status(404).json({ error: "Categoría no encontrada" });

    const entrenador = await Entrenador.findById(entrenadorId);
    if (!entrenador) return res.status(404).json({ error: "Entrenador no encontrado" });

    const evento = await Evento.create({
      categoria: categoriaId,
      entrenador: entrenadorId,
      fechaEvento,
      tipoEvento,
      asistencia: [], // se llenará al tomar asistencia
      cerrado: false
    });

    res.json({
      mensaje: "Evento programado correctamente",
      evento
    });

  } catch (error) {
    console.error("Error crearEvento:", error);
    res.status(500).json({ error: "Error al crear evento" });
  }
};


/* ============================================================
   🔵 Obtener detalle evento (para entrenador)
============================================================ */
exports.obtenerEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const evento = await Evento.findById(eventoId)
      .populate("categoria", "nombre")
      .populate("entrenador", "nombre")
      .populate("asistencia.jugador", "nombre rut");

    if (!evento)
      return res.status(404).json({ error: "Evento no encontrado" });

    let asistenciaFinal = evento.asistencia;

    // ============================================================
    // 🟡 SI EL EVENTO NO TIENE ASISTENCIA → CARGAR TODOS LOS JUGADORES
    // ============================================================
    if (!evento.asistencia || evento.asistencia.length === 0) {

      const jugadores = await Jugador.find({ categoria: evento.categoria._id });

      asistenciaFinal = jugadores.map(j => ({
        jugador: {
          _id: j._id,
          nombre: j.nombre,
          rut: j.rut
        },
        presente: false,
        observacion: "",
        motivoInasistencia: "",
        goles: 0,
        asistenciasGol: 0,
        pasesClave: 0,
        recuperaciones: 0,
        tirosArco: 0,
        faltasCometidas: 0,
        faltasRecibidas: 0,
        amarilla: false,
        roja: false,
        rendimiento: null
      }));
    }

    // ============================================================

    res.json({
      evento: {
        _id: evento._id,
        fecha: evento.fechaEvento,
        tipo: evento.tipoEvento,
        categoria: evento.categoria,
        entrenador: evento.entrenador,
        cerrado: evento.cerrado
      },
      asistencia: asistenciaFinal
    });

  } catch (error) {
    console.error("Error obtenerEvento:", error);
    res.status(500).json({ error: "Error al obtener evento" });
  }
};


/* ============================================================
   🔍 Detalle evento (para Director)
============================================================ */
exports.detalleEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const evento = await Evento.findById(eventoId)
      .populate("categoria", "nombre")
      .populate("entrenador", "nombre")
      .populate("asistencia.jugador", "nombre rut");

    if (!evento) return res.status(404).json({ error: "Evento no encontrado" });

    res.json(evento);

  } catch (error) {
    console.error("Error detalleEvento:", error);
    res.status(500).json({ error: "Error al obtener detalle del evento" });
  }
};

/* ============================================================
   🟣 Registrar asistencia completa
============================================================ */
exports.registrarAsistenciaEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { asistencia } = req.body;

    const evento = await Evento.findById(eventoId);
    if (!evento) return res.status(404).json({ error: "Evento no encontrado" });

    if (evento.cerrado)
      return res.status(403).json({ error: "El evento está cerrado, no se puede editar" });

    evento.asistencia = asistencia;
    await evento.save();

    res.json({ mensaje: "Asistencia registrada correctamente", evento });

  } catch (error) {
    console.error("Error registrarAsistenciaEvento:", error);
    res.status(500).json({ error: "Error al registrar asistencia" });
  }
};

/* ============================================================
   🟠 Actualizar asistencia individual por jugador
============================================================ */
exports.actualizarAsistenciaJugador = async (req, res) => {
  try {
    const { eventoId, jugadorId } = req.params;
    const { presente, observacion, motivoInasistencia } = req.body;

    const evento = await Evento.findById(eventoId);
    if (!evento) return res.status(404).json({ error: "Evento no encontrado" });
    if (evento.cerrado) return res.status(403).json({ error: "Evento cerrado" });

    const reg = evento.asistencia.find(a => a.jugador.toString() === jugadorId);
    if (!reg) return res.status(404).json({ error: "Jugador no está en este evento" });

    reg.presente = presente;
    reg.observacion = observacion;
    reg.motivoInasistencia = motivoInasistencia;

    await evento.save();

    res.json({ mensaje: "Asistencia actualizada", reg });

  } catch (error) {
    console.error("Error actualizarAsistenciaJugador:", error);
    res.status(500).json({ error: "Error al actualizar asistencia del jugador" });
  }
};

/* ============================================================
   🟡 Listar eventos por categoría
============================================================ */
exports.listarEventosPorCategoria = async (req, res) => {
  try {
    const { categoriaId } = req.params;

    const eventos = await Evento.find({ categoria: categoriaId })
      .sort({ fechaEvento: -1 });

    const respuesta = eventos.map(e => {
      const total = e.asistencia.length;
      const presentes = e.asistencia.filter(a => a.presente).length;
      const porcentaje = total > 0 ? ((presentes * 100) / total).toFixed(1) : 0;

      return {
        _id: e._id,
        fecha: e.fechaEvento,
        tipo: e.tipoEvento,
        porcentajeAsistencia: porcentaje,
        cerrado: e.cerrado
      };
    });

    res.json(respuesta);

  } catch (error) {
    console.error("Error listarEventosPorCategoria:", error);
    res.status(500).json({ error: "Error al listar eventos" });
  }
};

/* ============================================================
   🗑 Eliminar evento
============================================================ */
exports.eliminarEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const eliminado = await Evento.findByIdAndDelete(eventoId);
    if (!eliminado) return res.status(404).json({ error: "Evento no encontrado" });

    res.json({ mensaje: "Evento eliminado correctamente" });

  } catch (error) {
    console.error("Error eliminarEvento:", error);
    res.status(500).json({ error: "Error al eliminar evento" });
  }
};

/* ============================================================
   🔒 Cerrar evento
============================================================ */
exports.cerrarEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const evento = await Evento.findById(eventoId);
    if (!evento) return res.status(404).json({ error: "Evento no encontrado" });

    evento.cerrado = true;
    await evento.save();

    res.json({ mensaje: "Evento cerrado correctamente" });

  } catch (error) {
    console.error("Error cerrarEvento:", error);
    res.status(500).json({ error: "Error al cerrar evento" });
  }
};

/* ============================================================
   📊 Asistencia detallada por jugador
============================================================ */
exports.asistenciaPorJugador = async (req, res) => {
  try {
    const { jugadorId } = req.params;

    const eventos = await Evento.find({
      "asistencia.jugador": jugadorId
    }).sort({ fechaEvento: -1 });

    const detalle = eventos.map(e => {
      const reg = e.asistencia.find(r => String(r.jugador) === String(jugadorId));

      return {
        fecha: e.fechaEvento,
        tipo: e.tipoEvento,
        presente: reg?.presente || false,
        observacion: reg?.observacion || "",
        motivoInasistencia: reg?.motivoInasistencia || "",
        goles: reg?.goles || 0,
        asistenciasGol: reg?.asistenciasGol || 0,
        pasesClave: reg?.pasesClave || 0,
        recuperaciones: reg?.recuperaciones || 0,
        tirosArco: reg?.tirosArco || 0,
        faltasCometidas: reg?.faltasCometidas || 0,
        faltasRecibidas: reg?.faltasRecibidas || 0,
        amarilla: reg?.amarilla || false,
        roja: reg?.roja || false,
        rendimiento: reg?.rendimiento ?? null
      };
    });

    res.json(detalle);

  } catch (error) {
    console.error("Error asistenciaPorJugador:", error);
    res.status(500).json({ error: "Error al obtener asistencia del jugador" });
  }
};

/* ============================================================
   📈 Estadísticas jugador
============================================================ */
exports.estadisticasJugador = async (req, res) => {
  try {
    const { jugadorId } = req.params;

    const eventos = await Evento.find({
      "asistencia.jugador": jugadorId
    });

    let total = 0;
    let asistio = 0;
    let falto = 0;
    let goles = 0;
    let asistenciasGol = 0;
    let pasesClave = 0;
    let recuperaciones = 0;
    let tirosArco = 0;
    let faltasCometidas = 0;
    let faltasRecibidas = 0;
    let amarillas = 0;
    let rojas = 0;

    eventos.forEach(e => {
      const reg = e.asistencia.find(r => String(r.jugador) === String(jugadorId));
      if (!reg) return;

      total++;

      if (reg.presente) asistio++;
      else falto++;

      goles += reg.goles || 0;
      asistenciasGol += reg.asistenciasGol || 0;
      pasesClave += reg.pasesClave || 0;
      recuperaciones += reg.recuperaciones || 0;
      tirosArco += reg.tirosArco || 0;
      faltasCometidas += reg.faltasCometidas || 0;
      faltasRecibidas += reg.faltasRecibidas || 0;
      if (reg.amarilla) amarillas++;
      if (reg.roja) rojas++;
    });

    const porcentaje = total > 0 ? Number(((asistio / total) * 100).toFixed(1)) : 0;

    res.json({
      totalEventos: total,
      asistio,
      falto,
      porcentaje,
      goles,
      asistenciasGol,
      pasesClave,
      recuperaciones,
      tirosArco,
      faltasCometidas,
      faltasRecibidas,
      amarillas,
      rojas
    });

  } catch (error) {
    console.error("Error estadisticasJugador:", error);
    res.status(500).json({ error: "Error al obtener estadísticas del jugador" });
  }
};
