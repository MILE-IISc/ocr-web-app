const mongoose = require("mongoose");

const imageSchema = mongoose.Schema({
  fileName: { type: String, required: true },
  completed: { type: String, required: true },
  editor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

module.exports = mongoose.model("Image", imageSchema);
