const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  googleId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  roles: {
    type: [],
    required: true,
  },
  worksheets: [
    {
      type: Schema.Types.ObjectId,
      ref: "Worksheet",
    },
  ],
  profilePicture: {
    type: String,
    required: true,
  },
  assigned: {
    type: [Schema.Types.ObjectId],
    ref: "Worksheet",
  },
  students: {
    type: [Schema.Types.ObjectId],
    ref: "User",
  },
  classroomsAsTeacher: {
    type: [Schema.Types.ObjectId],
    ref: "Classroom",
  },
  classroomsAsStudent: {
    type: [Schema.Types.ObjectId],
    ref: "Classroom",
  },
  scores: {
    type: [Schema.Types.ObjectId],
    ref: "Score",
  },
  folders: {
    type: [Schema.Types.ObjectId],
    ref: "Folder",
  },
});

module.exports = mongoose.model("User", userSchema);
