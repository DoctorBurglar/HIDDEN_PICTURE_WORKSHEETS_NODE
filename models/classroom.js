const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const classroomSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  students: {
    type: [Schema.Types.ObjectId],
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("Classroom", classroomSchema);
