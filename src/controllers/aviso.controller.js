const Aviso = require("../models/aviso.model");
const Apoderado = require("../models/apoderado.model");
const Entrenador = require("../models/entrenador.model");
const Jugador = require("../models/jugador.model");
const { enviarCorreo } = require("../utils/email");

/* ================================
   LISTAR AVISOS
================================ */
exports.listarAvisos = async (req, res) => {
    try {
        const avisos = await Aviso.find().sort({ createdAt: -1 });
        res.json(avisos);
    } catch (error) {
        res.status(500).json({ error: "Error al listar avisos" });
    }
};

/* ================================
   CREAR AVISO
================================ */
exports.crearAviso = async (req, res) => {
  try {
    const { 
      titulo, 
      tipo, 
      destinatario, 
      destinatarioId,
      categoriaId,
      fechaEvento, 
      contenido,
      creadorID
    } = req.body;

    if (!titulo || !contenido) {
      return res.status(400).json({ error: "Título y contenido son obligatorios." });
    }

    // Crear en BD
    const nuevoAviso = await Aviso.create({
      titulo,
      tipo: tipo || "General",
      destinatario,
      destinatarioId: destinatarioId || null,
      fechaEvento: fechaEvento || null,
      contenido,
      categoriaId: categoriaId || null
    });

    /* =====================================================
       2️⃣ Construcción de lista de correos
    ====================================================== */
    let listaCorreos = [];

    // ================================
// APODERADOS
// ================================
    if (destinatario === "Apoderados") {

        // 1️⃣ Sin categoría seleccionada → no filtrar
        if (!categoriaSeleccionada || categoriaSeleccionada === "") {
            const apoderados = await Apoderado.find({}, "correo");
            listaCorreos = apoderados.map(a => a.correo);
        }

        // 2️⃣ "todas" → enviar a todas las categorías
        else if (categoriaSeleccionada === "todas") {
            const jugadores = await Jugador.find().populate("apoderado", "correo");

            listaCorreos = jugadores
                .map(j => j.apoderado?.correo)
                .filter(c => c);
        }

        // 3️⃣ Categoría específica
        else {
            const jugadores = await Jugador.find(
                { categoria: categoriaSeleccionada }
            ).populate("apoderado", "correo");

            listaCorreos = jugadores
                .map(j => j.apoderado?.correo)
                .filter(c => c);
        }
    }


    // ENTRENADORES
    else if (destinatario === "Entrenadores") {
        const entrenadores = await Entrenador.find({}, "correo");
        listaCorreos = entrenadores.map(e => e.correo);
    }

    // TODOS
    else if (destinatario === "Todos") {
        const apoderados = await Apoderado.find({}, "correo");
        const entrenadores = await Entrenador.find({}, "correo");
        listaCorreos = [
            ...apoderados.map(a => a.correo),
            ...entrenadores.map(e => e.correo)
        ];
    }

    // ENTRENADOR ESPECÍFICO
    else if (destinatario === "EntrenadorEspecifico") {
        const entrenador = await Entrenador.findById(destinatarioId);
        listaCorreos = [entrenador.correo];
    }

    // APODERADO ESPECÍFICO (jugador específico)
    else if (destinatario === "ApoderadoEspecifico") {
        const jugador = await Jugador.findById(destinatarioId)
            .populate("apoderado", "correo");

        if (!jugador || !jugador.apoderado?.correo) {
            return res.status(400).json({ error: "Apoderado sin correo." });
        }

        listaCorreos = [jugador.apoderado.correo];
    }

    listaCorreos = [...new Set(listaCorreos)];

    /* =====================================================
       3️⃣ Enviar correo
    ====================================================== */
    const htmlContent = `
      <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #2e7d32;">${titulo}</h2>
          <p><b>Tipo:</b> ${tipo}</p>
          ${fechaEvento ? `<p><b>Fecha:</b> ${new Date(fechaEvento).toLocaleDateString("es-CL")}</p>` : ""}
          <p style="white-space: pre-line;">${contenido}</p>
      </div>
    `;

    if (listaCorreos.length > 0) {
        await enviarCorreo(listaCorreos, `Aviso: ${titulo}`, htmlContent);
    }

    /* =====================================================
       4️⃣ Socket.io
    ====================================================== */
    if (global.io) {

        if (destinatario === "Todos") global.io.emit("nuevo-aviso", nuevoAviso);
        else if (destinatario === "Entrenadores") global.io.to("entrenador").emit("nuevo-aviso", nuevoAviso);
        else if (destinatario === "Apoderados") global.io.to("apoderado").emit("nuevo-aviso", nuevoAviso);
        else global.io.to(`user:${destinatarioId}`).emit("nuevo-aviso", nuevoAviso);
    }

    res.json({ mensaje: "Aviso creado correctamente", aviso: nuevoAviso });

  } catch (error) {
    console.error("Error crearAviso:", error);
    res.status(500).json({ error: "Error al crear aviso", detalle: error.message });
  }
};

/* ================================
   EDITAR AVISO
================================ */
exports.editarAviso = async (req, res) => {
    try {
        const avisoEditado = await Aviso.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(avisoEditado);
    } catch (error) {
        res.status(500).json({ error: "Error al editar aviso" });
    }
};

/* ================================
   ELIMINAR AVISO
================================ */
exports.eliminarAviso = async (req, res) => {
    try {
        await Aviso.findByIdAndDelete(req.params.id);
        res.json({ mensaje: "Aviso eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar aviso" });
    }
};
