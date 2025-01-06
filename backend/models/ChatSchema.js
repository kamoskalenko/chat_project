//
const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  messages: [{ text: String, createdAt: Date }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Chat = mongoose.model("Chat", ChatSchema);

module.exports = Chat;
