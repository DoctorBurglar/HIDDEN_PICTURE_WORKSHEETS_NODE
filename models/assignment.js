const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const assignmentSchema = new Schema(
  {
    assignmentName: {
      type: String,
      required: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    worksheet: {
      type: Object,
      required: true,
    },
    classroomAssigned: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    scores: {
      type: [Schema.Types.ObjectId],
      ref: "Score",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
