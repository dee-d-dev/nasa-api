const mongoose = require("mongoose");

const launchSchema = new mongoose.Schema({
  flightNumber: { type: Number, required: true },
  mission: { type: String, required: true },
  rocket: { type: String, required: true },
  launchDate: { type: Date, required: true },
  target: { type: mongoose.ObjectId, ref: "planet" },
  customer: [String],
  upcoming: { type: Boolean },
  success: { type: Boolean, default: true },
});

const Launch = mongoose.model("Launch", launchSchema);

module.exports = Launch;
