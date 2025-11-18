const mongoose = require("mongoose");

const RendimientoSchema = new mongoose.Schema({
  jugador: { type: mongoose.Schema.Types.ObjectId, ref: "Jugador", required: true },
  entrenador: { type: mongoose.Schema.Types.ObjectId, ref: "Entrenador", required: true },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: "Categoria", required: true },
  tipoEvento: { type: String, enum: ["Partido", "Torneo"], required: true },
  fechaEvento: { type: Date, required: true },
  goles: { type: Number, default: 0 },
  asistencias: { type: Number, default: 0 },
  tarjetas: { type: Number, default: 0 },
  observaciones: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Rendimiento", RendimientoSchema,"rendimientos");
