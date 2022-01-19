const User = require("../models/user");
const Classroom = require("../models/classroom");
const Assignment = require("../models/assignment");

exports.getClassrooms = async (req, res, next) => {
  const userId = req.headers.userid;
  try {
    const teacher = await User.findById(userId);
    if (!teacher) {
      const error = new Error("Failed to find user");
      error.statusCode = 404;
      throw error;
    }
    const classrooms = await Classroom.find({
      teacher: teacher._id,
    }).populate();
    console.log(classrooms, "yeah");
    res
      .status(200)
      .json({message: "successfully retreived classrooms", classrooms});
  } catch (err) {
    console.log(err);
  }
};

exports.postCreateClassroom = async (req, res, next) => {
  const userId = req.headers.userid;
  const classroomName = req.body.data.name;
  try {
    const teacher = await User.findById(userId);
    console.log(teacher);
    const code = await createClassroomCode(6);
    const classroom = new Classroom({
      name: classroomName,
      teacher: teacher._id,
      code,
      students: [],
    });
    teacher.classroomsAsTeacher.push(classroom._id);
    const result = await teacher.save();
    await classroom.save();
    console.log(result);
    res.status(200).json({message: "hello!", classroom});
  } catch (err) {
    console.log(err);
  }
};

exports.deleteClassroom = async (req, res, next) => {
  const userId = req.headers.userid;
  const classroomId = req.body.classroomId;
  try {
    const assignmentsDependingOnClassroom = await Assignment.find({
      classroomAssigned: classroomId,
    });
    if (assignmentsDependingOnClassroom.length > 0) {
      const error = new Error(
        "Deletion failed.  This classroom is being used in an assignment.  Delete any assignments for this classroom before deleting the classroom itself"
      );
      error.statusCode = 403;
      throw error;
    }
    const teacher = await User.findById(userId);
    teacher.classroomsAsTeacher.pull({_id: classroomId});
    const teacherResult = await teacher.save();
    //
    const classroomResult = await Classroom.deleteOne({_id: classroomId});
    // console.log(classroomResult);
    const studentResult = await User.updateMany(
      {classroomsAsStudent: classroomId},
      {$pull: {classroomsAsStudent: classroomId}}
    );
    console.log(studentResult, "2222222222222");
    res.status(200).json({
      message: "successfully deleted classroom",
      classroomId,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getStudents = async (req, res, next) => {
  const classroomId = req.params.classroomId;
  const userId = req.user.sub.split("|")[1];
  try {
    const students = await User.find({
      classroomsAsStudent: classroomId,
    }).select("name email profilePicture");
    console.log(students, "1111");
    res.json({message: "Successfully retreived students", students});
  } catch (err) {
    console.log(err);
  }
};

exports.deleteStudent = async (req, res, next) => {
  const userId = req.user.sub.split("|")[1];
  const studentToDeleteId = req.body.data.id;
  const classroomToRemoveStudentFromId = req.body.data.classroomId;
  console.log(studentToDeleteId, classroomToRemoveStudentFromId);
  try {
    const classroom = await Classroom.findOne({
      _id: classroomToRemoveStudentFromId,
    });
    const result = await classroom.students.pull(studentToDeleteId);
    await classroom.save();
    const student = await User.findOne({_id: studentToDeleteId});
    student.classroomsAsStudent.pull({_id: classroomToRemoveStudentFromId});
    await student.save();
    res
      .status(200)
      .json({message: "Student successfully removed from classrooom"});
  } catch (err) {
    console.log(err);
  }
};

const createClassroomCode = async (length) => {
  let chars = "abcdefghijklmnopqrstuvwxyz123456789";
  let codeArray = [];
  for (let i = 0; i < length; i++) {
    codeArray[i] = chars[Math.floor(Math.random() * 35)];
  }
  const code = codeArray.join("");
  try {
    const classroom = await Classroom.findOne({code: code});
    console.log(classroom);
    if (!classroom) {
      return code;
    } else createClassroomCode(length);
  } catch (err) {
    console.log(err);
  }
};
