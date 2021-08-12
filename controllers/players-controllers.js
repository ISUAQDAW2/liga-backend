const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Player = require("../models/player");
const User = require("../models/user");

const getPlayers = async (req, res, next) => {
  //const userId = req.params.uid;
  let players;
  try {
    players = await Player.find({}).populate("ofertas");
  } catch (err) {
    const error = new HttpError("Fetching users failed, please try again", 500);
    return next(error);
  }
  res.json({
    players: players.map((player) => player.toObject({ getters: true })),
  });
};

const getPlayersMercado = async (req, res, next) => {
  let players;
  try {
    players = await Player.find({ transferible: true });
  } catch (err) {
    const error = new HttpError("Fetching users failed, please try again", 500);
    return next(error);
  }
  res.json({
    players: players.map((player) => player.toObject({ getters: true })),
  });
};

const getPlayerById = async (req, res, next) => {
  const playerId = req.params.pid;

  let player;
  try {
    player = await Player.findById(playerId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a player.",
      500
    );
    return next(error);
  }

  if (!player) {
    const error = new HttpError(
      "Could not find player for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ player: player.toObject({ getters: true }) });
};

const getPlayersByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let players;
  let userWithPlayers;
  try {
    userWithPlayers = await User.findById(userId).populate("players");
  } catch (err) {
    const error = new HttpError(
      "Fetching players failed, please try again later.",
      500
    );
    return next(error);
  }

  // if (!players || players.length === 0) {
  if (!userWithPlayers || userWithPlayers.players.length === 0) {
    return next(new HttpError("No se han encontrado jugadores", 404));
  }

  res.json({
    players: userWithPlayers.players.map((player) =>
      player.toObject({ getters: true })
    ),
  });
};

const createPlayer = async (req, res, next) => {
  /* const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
 */
  const { title, clausula, address, image, Expires } = req.body;

  const createdPlayer = new Player({
    title,
    clausula,
    address,
    transferible: false,
    Expires,
    image,
    ofertas: [],
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Creating player failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlayer.save({ session: sess });
    user.players.push(createdPlayer);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating player failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ player: createdPlayer });
};

const updatePlayer = async (req, res, next) => {
  /* const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  } */

  const { clausula } = req.body;
  const playerId = req.params.pid;

  let player;
  try {
    player = await Player.findById(playerId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update player.",
      500
    );
    return next(error);
  }

  if (player.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "No estás autorizado para subir la cláusula de este jugador.",
      401
    );
    return next(error);
  }
  player.clausula = clausula;

  try {
    await player.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update player.",
      500
    );
    return next(error);
  }

  res.status(200).json({ player: player.toObject({ getters: true }) });
};

const deletePlayer = async (req, res, next) => {
  const playerId = req.params.pid;

  let player;
  try {
    player = await Player.findById(playerId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete player.",
      500
    );
    return next(error);
  }

  if (!player) {
    const error = new HttpError("Could not find player for this id.", 404);
    return next(error);
  }

  if (player.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "No estás autorizado para realizar esta gestión sobre el jugador.",
      401
    );
  }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await player.remove({ session: sess });
    player.creator.players.pull(player);
    await player.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete player.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted player." });
};

exports.getPlayerById = getPlayerById;
exports.getPlayersByUserId = getPlayersByUserId;
exports.createPlayer = createPlayer;
exports.updatePlayer = updatePlayer;
exports.deletePlayer = deletePlayer;
exports.getPlayersMercado = getPlayersMercado;
exports.getPlayers = getPlayers;
