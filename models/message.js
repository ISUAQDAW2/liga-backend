const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema({
  TransferMessage: { type: String, required: true },
});

module.exports = mongoose.model("Message", messageSchema);
