const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const playerSchema = new Schema({
  title: { type: String, required: true },
  clausula: { type: Number, required: true },
  marketValue: { type: Number, required: true },
  transferible: { type: Boolean, required: true },
  image: { type: String, required: true },
  escudo: { type: String, required: true },
  Expires: { type: Number, required: true },
  address: { type: String, required: true },
  creatorName: { type: String, required: true },
  clausulaInicial: { type: Number, required: true },
  ofertas: [{ type: mongoose.Types.ObjectId, required: true, ref: "Oferta" }],
  creator: { type: mongoose.Types.ObjectId, required: false, ref: "User" },
  ownerDiscard: {
    type: mongoose.Types.ObjectId,
    required: false /* , ref: "User"  */,
  },
  discardExpiresDate: { type: Number, required: false },
  team: { type: String, required: true },
});

module.exports = mongoose.model("Player", playerSchema);
