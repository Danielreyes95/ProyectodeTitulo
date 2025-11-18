const Categoria = require("../models/categoria.model");
const Jugador = require("../models/jugador.model");
const Asistencia = require("../models/asistencia.model");
const Rendimiento = require("../models/rendimiento.model");

// 🟢 Obtener resumen general de todas las categorías
exports.obtenerResumenGeneral = async (req, res) => {
  try {
    const categorias = await Categoria.find().populate("entrenador", "nombre");

    const resumen = [];

    for (const cat of categorias) {
      // Asistencias de la categoría
      const asistencias = await Asistencia.find({ categoria: cat._id });
      const totalAsistencias = asistencias.length;
      const presentes = asistencias.filter(a => a.asistencia).length;
      const porcentajeAsistencia =
        totalAsistencias > 0 ? ((presentes / totalAsistencias) * 100).toFixed(1) : 0;

      // Rendimiento de la categoría
      const rendimientos = await Rendimiento.find({ categoria: cat._id });
      const golesTotales = rendimientos.reduce((acc, r) => acc + (r.goles || 0), 0);
      const tarjetasTotales = rendimientos.reduce((acc, r) => acc + (r.tarjetas || 0), 0);

      resumen.push({
        categoria: cat.nombre,
        entrenador: cat.entrenador ? cat.entrenador.nombre : "Sin asignar",
        totalJugadores: await Jugador.countDocuments({ categoria: cat._id }),
        porcentajeAsistencia: `${porcentajeAsistencia}%`,
        golesTotales,
        tarjetasTotales
      });
    }

    res.json({
      mensaje: "✅ Resumen general obtenido correctamente",
      resumen
    });

  } catch (error) {
    res.status(500).json({ error: "Error al generar resumen", detalle: error.message });
  }
};

// 🟣 Obtener estadísticas de un jugador específico
exports.obtenerResumenJugador = async (req, res) => {
  try {
    const { jugadorId } = req.params;

    const jugador = await Jugador.findById(jugadorId).populate("categoria", "nombre");
    if (!jugador) return res.status(404).json({ error: "Jugador no encontrado" });

    // Asistencias del jugador
    const asistencias = await Asistencia.find({ jugador: jugadorId });
    const totalAsistencias = asistencias.length;
    const presentes = asistencias.filter(a => a.asistencia).length;
    const porcentajeAsistencia =
      totalAsistencias > 0 ? ((presentes / totalAsistencias) * 100).toFixed(1) : 0;

    // Rendimientos del jugador
    const rendimientos = await Rendimiento.find({ jugador: jugadorId });
    const golesTotales = rendimientos.reduce((acc, r) => acc + (r.goles || 0), 0);
    const asistenciasGol = rendimientos.reduce((acc, r) => acc + (r.asistenciasGol || 0), 0);
    const tarjetasTotales = rendimientos.reduce((acc, r) => acc + (r.tarjetas || 0), 0);

    res.json({
      mensaje: "✅ Resumen del jugador obtenido correctamente",
      jugador: {
        nombre: jugador.nombre,
        categoria: jugador.categoria ? jugador.categoria.nombre : "Sin categoría"
      },
      resumen: {
        porcentajeAsistencia: `${porcentajeAsistencia}%`,
        golesTotales,
        asistenciasGol,
        tarjetasTotales
      }
    });

  } catch (error) {
    res.status(500).json({ error: "Error al obtener resumen del jugador", detalle: error.message });
  }
};
