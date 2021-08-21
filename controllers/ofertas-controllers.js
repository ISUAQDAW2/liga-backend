const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Oferta = require("../models/oferta");
const Player = require("../models/player");
const User = require("../models/user");

const getOfertasByUserId = async (req, res, next) => {
  const quantity = req.params.q;
  const playerId = req.params.pid;

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Algo fue mal, no se pudo encontrar al usuario.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "No se pudo encontrar el usuario con ese id.",
      404
    );
    return next(error);
  }

  const userPresupuesto = user.presupuesto;

  let userWithOfertas;
  try {
    userWithOfertas = await Oferta.find({ ofertanteId: req.userData.userId });
  } catch (err) {
    const error = new HttpError(
      "La obtención de ofertas falló, inténtelo de nuevo.",
      500
    );
    return next(error);
  }

  const quantityOffer = userWithOfertas
    .filter((oferta) => oferta.playerId.toString() !== playerId.toString())
    .map((oferta) => oferta.cantidad);
  let sum = quantityOffer.reduce((x, y) => x + y, 0);

  if (!userWithOfertas) {
    sum = 0;
  }

  const debt = Number(quantity) + Number(sum);

  if (userPresupuesto < debt) {
    console.log(userPresupuesto);
    const error = new HttpError(
      `Operación denegada. Su presupuesto es menor a la deuda acumulada`,
      404
    );
    return next(error);
  }

  res.status(200).json({ message: "Operación realizada con éxito." });
};

const getOfertasMercado = async (req, res, next) => {
  let ofertas;
  try {
    ofertas = await Oferta.find({ transferible: true });
  } catch (err) {
    const error = new HttpError(
      "La obtención de ofertas falló, inténtelo de nuevo",
      500
    );
    return next(error);
  }
  res.json({
    ofertas: ofertas.map((oferta) => oferta.toObject({ getters: true })),
  });
};

const getOfertaById = async (req, res, next) => {
  const ofertaId = req.params.oid;

  let oferta;
  try {
    oferta = await Oferta.findById(ofertaId);
  } catch (err) {
    const error = new HttpError(
      "Algo fue mal, no se pudo obtener la oferta.",
      500
    );
    return next(error);
  }

  if (!oferta) {
    const error = new HttpError(
      "No se pudo encontrar la oferta con ese id.",
      404
    );
    return next(error);
  }

  res.json({ oferta: oferta.toObject({ getters: true }) });
};

const getOfertasByPlayerId = async (req, res, next) => {
  const playerId = req.params.pid;

  let playerWithOfertas;
  try {
    playerWithOfertas = await Player.findById(playerId).populate("ofertas");
  } catch (err) {
    const error = new HttpError(
      "La obtención de ofertas falló, inténtelo de nuevo.",
      500
    );
    return next(error);
  }

  res.json({
    ofertas: playerWithOfertas?.ofertas.map((oferta) =>
      oferta.toObject({ getters: true })
    ),
  });
};

const createOferta = async (req, res, next) => {
  const quantity = req.params.q;
  const playerClause = req.params.clause;

  if (Number(quantity) > Number(playerClause)) {
    const error = new HttpError(
      `Operación denegada. No puede ofertar una cantidad mayor que el importe de la cláusula de rescisión del jugador.`,
      404
    );
    return next(error);
  }

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Algo fue mal, no se pudo encontrar al usuario.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "No se pudo encontrar al usuario con ese id.",
      404
    );
    return next(error);
  }

  const userPresupuesto = user.presupuesto;

  let userWithOfertas;
  try {
    userWithOfertas = await Oferta.find({ ofertanteId: req.userData.userId });
  } catch (err) {
    const error = new HttpError(
      "La obtención de ofertas falló, inténtelo de nuevo.",
      500
    );
    return next(error);
  }

  const quantityOffer = userWithOfertas.map((oferta) => oferta.cantidad);
  let sum = quantityOffer.reduce((x, y) => x + y, 0);

  if (!userWithOfertas) {
    sum = 0;
  }

  if (userWithOfertas.length + user.players.length >= 18) {
    const error = new HttpError(
      "No se pudo enviar la oferta, ya que las ofertas realizadas más el número de jugadores en plantilla sería mayor a 18.",
      404
    );
    return next(error);
  }

  const debt = Number(quantity) + Number(sum);

  if (Number(userPresupuesto) < debt) {
    console.log(userPresupuesto);
    const error = new HttpError(
      `Operación denegada. Su presupuesto es menor a la deuda acumulada`,
      404
    );
    return next(error);
  }

  const {
    cantidad,
    ofertanteId,
    playerId,
    equipoOfertante,
    nombreOfertante,
    escudoOfertante,
  } = req.body;

  const createdOferta = new Oferta({
    cantidad,
    ofertanteId,
    playerId,
    equipoOfertante,
    nombreOfertante,
    escudoOfertante,
  });

  let player;
  try {
    player = await Player.findById(playerId);
  } catch (err) {
    const error = new HttpError(
      "La creación de la oferta falló, inténtelo de nuevo",
      500
    );
    return next(error);
  }

  if (!player) {
    const error = new HttpError("No se encontró a un jugador con ese id.", 404);
    return next(error);
  }

  console.log(player);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdOferta.save({ session: sess });
    player.ofertas.push(createdOferta);
    await player.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "La creación de la oferta falló, inténtelo de nuevo.",
      500
    );
    return next(error);
  }

  res.status(201).json({ oferta: createdOferta });
};

const updateOferta = async (req, res, next) => {
  const { cantidad } = req.body;
  const ofertaId = req.params.oid;
  const playerId = req.params.pid;
  const quantity = req.params.q;
  const playerClause = req.params.clause;

  if (Number(quantity) > Number(playerClause)) {
    const error = new HttpError(
      `Operación denegada. No puede ofertar una cantidad mayor que el importe de la cláusula de rescisión del jugador.`,
      404
    );
    return next(error);
  }
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Algo fue mal, no se pudo encontrar al usuario.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "No se pudo encontrar a un usuario con ese id.",
      404
    );
    return next(error);
  }

  const userPresupuesto = user.presupuesto;

  let userWithOfertas;
  try {
    userWithOfertas = await Oferta.find({ ofertanteId: req.userData.userId });
  } catch (err) {
    const error = new HttpError(
      "La obtención de ofertas falló, inténtelo de nuevo.",
      500
    );
    return next(error);
  }

  const quantityOffer = userWithOfertas
    .filter((oferta) => oferta.playerId.toString() !== playerId.toString())
    .map((oferta) => oferta.cantidad);
  let sum = quantityOffer.reduce((x, y) => x + y, 0);

  if (!userWithOfertas) {
    sum = 0;
  }

  const debt = Number(quantity) + Number(sum);

  if (Number(userPresupuesto) < debt) {
    console.log(userPresupuesto);
    const error = new HttpError(
      `Operación denegada. Su presupuesto es menor a la deuda acumulada ${debt}   ${quantityOffer}`,
      404
    );
    return next(error);
  }
  let oferta;
  try {
    oferta = await Oferta.findById(ofertaId);
  } catch (err) {
    const error = new HttpError(
      "Algo fue mal, no se pudo actualizar la oferta.",
      500
    );
    return next(error);
  }

  oferta.cantidad = cantidad;

  try {
    await oferta.save();
  } catch (err) {
    const error = new HttpError(
      "Algo fue mal, no se pudo actualizar la oferta.",
      500
    );
    return next(error);
  }

  res.status(200).json({ oferta: oferta.toObject({ getters: true }) });
};

const deleteOferta = async (req, res, next) => {
  const ofertaId = req.params.oid;

  let oferta;
  try {
    oferta = await Oferta.findById(ofertaId).populate("playerId");
  } catch (err) {
    const error = new HttpError(
      "Algo fue mal, no se pudo eliminar la oferta.",
      500
    );
    return next(error);
  }

  if (!oferta) {
    const error = new HttpError(
      "No se pudo encontrar una oferta para ese id.",
      404
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await oferta.remove({ session: sess });
    oferta.playerId.ofertas.pull(oferta);
    await oferta.playerId.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Algo fue mal, no se pudo eliminar la oferta.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted oferta." });
};

exports.getOfertaById = getOfertaById;
exports.getOfertasByPlayerId = getOfertasByPlayerId;
exports.createOferta = createOferta;
exports.updateOferta = updateOferta;
exports.deleteOferta = deleteOferta;
exports.getOfertasMercado = getOfertasMercado;
exports.getOfertasByUserId = getOfertasByUserId;
