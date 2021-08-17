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
      "Something went wrong, could not find a player.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find user for the provided id.",
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
      "Fetching ofertas failed, please try again later.",
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
      `Operación denegada. Tu presupuesto es menor a la deuda acumulada`,
      404
    );
    return next(error);
  }

  res.status(200).json({ message: "Operación realizada con éxito." });

  /* res.json({
    ofertas: userWithOfertas.map((oferta) =>
      oferta.toObject({ getters: true })
    ),
  }); */
};

const getOfertasMercado = async (req, res, next) => {
  let ofertas;
  try {
    ofertas = await Oferta.find({ transferible: true });
  } catch (err) {
    const error = new HttpError(
      "Fetching players failed, please try again",
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
      "Something went wrong, could not find a oferta.",
      500
    );
    return next(error);
  }

  if (!oferta) {
    const error = new HttpError(
      "Could not find oferta for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ oferta: oferta.toObject({ getters: true }) });
};

const getOfertasByPlayerId = async (req, res, next) => {
  const playerId = req.params.pid;

  // let ofertas;
  let playerWithOfertas;
  try {
    playerWithOfertas = await Player.findById(playerId).populate("ofertas");
  } catch (err) {
    const error = new HttpError(
      "Fetching ofertas failed, please try again later.",
      500
    );
    return next(error);
  }

  // if (!ofertas || ofertas.length === 0) {
  //if (!playerWithOfertas || playerWithOfertas.ofertas.length === 0) {
  /* return next(
      new HttpError("Could not find ofertas for the provided player id.", 404)
    ); */
  //}

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
      `Operación denegada. No puedes ofertar una cantidad mayor que el importe de la cláusula de rescisión del jugador.`,
      404
    );
    return next(error);
  }

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a player.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find user for the provided id.",
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
      "Fetching ofertas failed, please try again later.",
      500
    );
    return next(error);
  }

  const quantityOffer = userWithOfertas.map((oferta) => oferta.cantidad);
  let sum = quantityOffer.reduce((x, y) => x + y, 0);

  if (!userWithOfertas) {
    sum = 0;
  }

  const debt = Number(quantity) + Number(sum);

  if (Number(userPresupuesto) < debt) {
    console.log(userPresupuesto);
    const error = new HttpError(
      `Operación denegada. Tu presupuesto es menor a la deuda acumulada`,
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
      "Creating oferta failed, please try again.",
      500
    );
    return next(error);
  }

  if (!player) {
    const error = new HttpError("Could not find player for provided id.", 404);
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
      "Creating oferta failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ oferta: createdOferta });
};

const updateOferta = async (req, res, next) => {
  /*  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  } */

  const { cantidad } = req.body;
  const ofertaId = req.params.oid;
  const playerId = req.params.pid;
  const quantity = req.params.q;
  const playerClause = req.params.clause;

  if (Number(quantity) > Number(playerClause)) {
    const error = new HttpError(
      `Operación denegada. No puedes ofertar una cantidad mayor que el importe de la cláusula de rescisión del jugador.`,
      404
    );
    return next(error);
  }
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a player.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find user for the provided id.",
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
      "Fetching ofertas failed, please try again later.",
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
      `Operación denegada. Tu presupuesto es menor a la deuda acumulada ${debt}   ${quantityOffer}`,
      404
    );
    return next(error);
  }
  let oferta;
  try {
    oferta = await Oferta.findById(ofertaId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update oferta.",
      500
    );
    return next(error);
  }

  oferta.cantidad = cantidad;

  try {
    await oferta.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update oferta.",
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
      "Something went wrong, could not delete oferta.",
      500
    );
    return next(error);
  }

  if (!oferta) {
    const error = new HttpError("Could not find oferta for this id.", 404);
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
      "Something went wrong, could not delete oferta.",
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
