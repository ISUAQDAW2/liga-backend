const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Algo falló en la obtención de usuarios, inténtelo de nuevo",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const updateUser = async (req, res, next) => {
  const { presupuesto } = req.body;
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Algo fue mal, no se pudo actualizar el usuario.",
      500
    );
    return next(error);
  }

  user.presupuesto = presupuesto;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Algo fue mal, no se pudo guardar la información.",
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Credenciales inválidas, por favor, revíselas.", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "El registro del usuario falló, inténtelo de nuevo.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "El usuario ya existe, inicie sesión en su lugar.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "No se pudo crear al usuario, inténtelo de nuevo.",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    equipo: "Equipo no asignado",
    email,
    image: "https://imgur.com/2FS8g0d.png",
    division: "Cuarta",
    password: hashedPassword,
    presupuesto: 6000,
    players: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "El registro del usuario falló, inténtelo de nuevo.",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "El registro del usuario falló, inténtelo de nuevo",
      500
    );
    return next(error);
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    token: token,
    presupuesto: createdUser.presupuesto,
    name: createdUser.name,
    equipo: createdUser.equipo,
    image: createdUser.image,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "El inicio de sesión falló, inténtelo de nuevo.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Credenciales incorrectas, no se pudo iniciar sesión.",
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "No se pudo iniciar sesión, compruebe que sus credenciales son correctas.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Credenciales incorrectas, no se pudo iniciar sesión.",
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "El inicio de sesión falló, inténtelo de nuevo.",
      500
    );
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
    presupuesto: existingUser.presupuesto,
    image: existingUser.image,
    equipo: existingUser.equipo,
    name: existingUser.name,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
exports.updateUser = updateUser;
