const express = require("express");
const router = express.Router();
const eventoController = require("../controllers/evento.controller");

// Crear evento
router.post("/crear", eventoController.crearEvento);

// Listar eventos por categoría
router.get("/categoria/:categoriaId", eventoController.listarEventosPorCategoria);

// Detalle completo del evento (director)
router.get("/detalle/:eventoId", eventoController.detalleEvento);

// Actualizar asistencia individual
router.put("/:eventoId/asistencia/:jugadorId", eventoController.actualizarAsistenciaJugador);

// Registrar asistencia completa
router.post("/:eventoId/asistencia", eventoController.registrarAsistenciaEvento);

// Cerrar evento
router.put("/:eventoId/cerrar", eventoController.cerrarEvento);

// Obtener detalle evento (entrenador)
router.get("/:eventoId", eventoController.obtenerEvento);

// Eliminar evento
router.delete("/:eventoId", eventoController.eliminarEvento);

// Asistencia detallada por jugador
router.get("/jugador/:jugadorId", eventoController.asistenciaPorJugador);

// estadísticas jugador
router.get("/jugador/:jugadorId/stats", eventoController.estadisticasJugador);

module.exports = router;
