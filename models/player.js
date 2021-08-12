const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const playerSchema = new Schema({
  title: { type: String, required: true },
  clausula: { type: Number, required: true },
  transferible: { type: Boolean, required: true },
  image: { type: String, required: true },
  Expires: { type: Number, required: true },
  address: { type: String, required: true },
  ofertas: [{ type: mongoose.Types.ObjectId, required: true, ref: "Oferta" }],
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model("Player", playerSchema);
