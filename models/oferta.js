const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ofertaSchema = new Schema({
  cantidad: { type: Number, required: true },
  ofertanteId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  playerId: { type: mongoose.Types.ObjectId, required: true, ref: "Player" },
  equipoOfertante: { type: String, required: true },
  nombreOfertante: { type: String, required: true },
  escudoOfertante: { type: String, required: true },
});

module.exports = mongoose.model("Oferta", ofertaSchema);
