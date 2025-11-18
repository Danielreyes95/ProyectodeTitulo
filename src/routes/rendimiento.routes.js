const express = require("express");
const router = express.Router();
const rendimientoController = require("../controllers/rendimiento.controller");

// Registrar rendimiento
router.post("/registrar", rendimientoController.registrarRendimiento);

// Consultar por jugador
router.get("/jugador/:jugadorId", rendimientoController.obtenerRendimientoPorJugador);

// Consultar por categoría
router.get("/categoria/:categoriaId", rendimientoController.obtenerRendimientosPorCategoria);

// Actualizar registro
router.put("/:id", rendimientoController.actualizarRendimiento);

module.exports = router;
