const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Message = require("../models/message");

const getMessages = async (req, res, next) => {
  let messages;
  try {
    messages = await Message.find({}).sort([["_id", -1]]);
  } catch (err) {
    const error = new HttpError(
      "Fetching messages failed, please try again",
      500
    );
    return next(error);
  }
  res.status(200).json({
    messages: messages.map((message) => message.toObject({ getters: true })),
  });
};

const createMessage = async (req, res, next) => {
  const { TransferMessage } = req.body;

  const createdMessage = new Message({
    TransferMessage,
  });

  /* let user;
  try {
    user = await User.findById(creator);
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

  console.log(user); */

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdMessage.save({ session: sess });
    /*     user.players.push(createdPlayer);
    await user.save({ session: sess }); */
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating message failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ message: createdMessage });
};

exports.getMessages = getMessages;
exports.createMessage = createMessage;
