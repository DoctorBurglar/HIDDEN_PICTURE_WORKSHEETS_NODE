const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const worksheetSchema = new Schema({
  worksheetName: {
    type: String,
    required: true,
  },
  questionAnswers: {
    type: Object,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  mainImageUrl: {
    type: String,
  },
  panelImageUrl: {
    type: String,
  },
  panelNumber: {
    type: Number,
    required: true,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Folder",
  },
});

module.exports = mongoose.model("Worksheet", worksheetSchema);
