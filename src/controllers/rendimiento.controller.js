const Rendimiento = require("../models/rendimiento.model");
const Jugador = require("../models/jugador.model");
const Entrenador = require("../models/entrenador.model");
const Categoria = require("../models/categoria.model");

// 🟢 Registrar rendimiento (solo para su categoría)
exports.registrarRendimiento = async (req, res) => {
  try {
    const {
      jugadorId,
      entrenadorId,
      tipoEvento,
      fechaEvento,
      goles,
      asistenciasGol,
      tarjetas,
      observaciones
    } = req.body;

    // 1️⃣ Verificar existencia del entrenador
    const entrenador = await Entrenador.findById(entrenadorId);
    if (!entrenador)
      return res.status(404).json({ error: "Entrenador no encontrado" });

    // 2️⃣ Verificar existencia del jugador
    const jugador = await Jugador.findById(jugadorId).populate("categoria");
    if (!jugador)
      return res.status(404).json({ error: "Jugador no encontrado" });

    // 3️⃣ Validar que el jugador pertenezca a la categoría del entrenador
    if (String(jugador.categoria) !== String(entrenador.categoria)) {
      return res.status(403).json({
        error:
          "El jugador no pertenece a la categoría del entrenador. No se puede registrar rendimiento."
      });
    }

    // 4️⃣ Crear el registro
    const nuevoRendimiento = await Rendimiento.create({
      jugador: jugadorId,
      entrenador: entrenadorId,
      categoria: entrenador.categoria,
      tipoEvento,
      fechaEvento,
      goles,
      asistenciasGol,
      tarjetas,
      observaciones
    });

    res.json({
      mensaje: "✅ Rendimiento registrado correctamente",
      rendimiento: nuevoRendimiento
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al registrar rendimiento", detalle: error.message });
  }
};

// 🟡 Obtener rendimientos de un jugador
exports.obtenerRendimientoPorJugador = async (req, res) => {
  try {
    const { jugadorId } = req.params;

    const registros = await Rendimiento.find({ jugador: jugadorId })
      .populate("entrenador", "nombre")
      .populate("categoria", "nombre")
      .sort({ fechaEvento: -1 });

    res.json({
      mensaje: "✅ Rendimientos del jugador obtenidos correctamente",
      registros
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener rendimientos", detalle: error.message });
  }
};

// 🟣 Obtener rendimientos por categoría (para entrenador o director)
exports.obtenerRendimientosPorCategoria = async (req, res) => {
  try {
    const { categoriaId } = req.params;

    const registros = await Rendimiento.find({ categoria: categoriaId })
      .populate("jugador", "nombre rut")
      .populate("entrenador", "nombre")
      .sort({ fechaEvento: -1 });

    res.json({
      mensaje: "✅ Rendimientos de la categoría obtenidos",
      registros
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener rendimientos por categoría",
      detalle: error.message
    });
  }
};

// 🔵 Actualizar un registro de rendimiento
exports.actualizarRendimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { goles, asistenciasGol, tarjetas, observaciones } = req.body;

    const registro = await Rendimiento.findByIdAndUpdate(
      id,
      { goles, asistenciasGol, tarjetas, observaciones },
      { new: true }
    );

    if (!registro)
      return res.status(404).json({ error: "Registro de rendimiento no encontrado" });

    res.json({
      mensaje: "✅ Rendimiento actualizado correctamente",
      registro
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar rendimiento",
      detalle: error.message
    });
  }
};
