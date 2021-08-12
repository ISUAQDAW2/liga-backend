const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  equipo: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },
  division: { type: String, required: true },
  presupuesto: { type: Number, required: true },
  players: [{ type: mongoose.Types.ObjectId, required: true, ref: "Player" }],
  /* ofertasRealizadas: [
    { type: mongoose.Types.ObjectId, required: true, ref: "Oferta" },
  ], */
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
