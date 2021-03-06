const { validationResult } = require("express-validator");

const User = require("../models/user");
const Classroom = require("../models/classroom");
const Worksheet = require("../models/worksheet");
const Assignment = require("../models/assignment");
const Score = require("../models/score");
const router = require("../routes/auth");

exports.getAssignmentData = async (req, res, next) => {
  console.log("get assignment data :)");
  const userId = req.headers.userid;
  console.log(userId);
  try {
    const user = await User.findById(userId)
      .populate({
        path: "worksheets",
        select: "worksheetName parent",
        model: "Worksheet",
      })
      .populate({
        path: "folders",
        model: "Folder",
      })
      .populate({
        path: "classroomsAsTeacher",
        select: "name",
        model: "Classroom",
      });
    if (!user) {
      const error = new Error("Something went wrong.  No user found");
      error.statusCode = 404;
      throw error;
    }
    const worksheets = user.worksheets;
    const folders = user.folders;
    const classrooms = user.classroomsAsTeacher;

    // const classrooms = await Classroom.find({ teacher: userId }).select("name");
    // const worksheets = await Worksheet.find({ createdBy: userId }).select(
    //   "worksheetName parent"
    // );
    console.log(classrooms, worksheets);
    res.status(200).json({
      message: "Successfully retreived assignment data",
      classrooms,
      worksheets,
      folders,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAssignments = async (req, res, next) => {
  console.log("get those assignments!!");
  const userId = req.headers.userid;
  try {
    const assignments = await Assignment.find({ teacher: userId })
      .populate({
        path: "scores",
        model: "Score",
        populate: {
          path: "student",
          model: "User",
        },
      })
      .populate({
        path: "classroomAssigned",
        model: "Classroom",
      });
    res
      .status(200)
      .json({ message: "successfully retreived assignments", assignments });
  } catch (err) {
    console.log(err);
  }
};

exports.postCreateAssignment = async (req, res, next) => {
  console.log(req.body.dueDate);
  const dueDate = new Date(req.body.dueDate).getTime();
  const assignmentName = req.body.assignmentName;
  const worksheet = req.body.worksheet;
  const classroomAssigned = req.body.classroomAssigned;
  const userId = req.headers.userid;
  try {
    const errors = validationResult(req);

    console.log(errors);

    if (!errors.isEmpty()) {
      const error = new Error("Failed to assign.  Please enter valid input");
      error.statusCode = 400;
      error.data = errors;
      throw error;
    }
    const assignedWorksheet = await Worksheet.findById(worksheet);
    if (!assignedWorksheet) {
      const error = new Error({
        message: "Failed to create assignment.  No worksheet found",
      });
      error.statusCode = 404;
      throw error;
    }
    // setting the answers to an empty string in case they were filled in by the teacher while testing the worksheet
    const questionAnsersForCopy = {};
    Object.keys(assignedWorksheet.questionAnswers).forEach((key) => {
      questionAnsersForCopy[key] = {
        ...assignedWorksheet.questionAnswers[key],
        answer: "",
        showPanel:
          assignedWorksheet.questionAnswers[key].answerKey === ""
            ? false
            : true,
        answerWasAttempted: false,
      };
    });
    // making a copy of the worksheet so it's no longer linked to the original (in case edits happen while assigned)
    const worksheetCopy = {
      worksheetName: assignedWorksheet.worksheetName,
      questionAnswers: questionAnsersForCopy,
      mainImageUrl: assignedWorksheet.mainImageUrl,
      panelImageUrl: assignedWorksheet.panelImageUrl,
      panelNumber: assignedWorksheet.panelNumber,
    };

    const user = await User.findById(userId);
    const scores = [];

    const assignment = new Assignment({
      assignmentName,
      teacher: user._id,
      worksheet: worksheetCopy,
      classroomAssigned,
      dueDate,
      scores,
    });

    const assignmentResult = await assignment.save();

    const scoresForAssignment = [];

    const classroom = await Classroom.findById(classroomAssigned);

    for (const student of classroom.students) {
      const score = new Score({
        assignment: assignmentResult._id,
        student,
        questionAnswers: questionAnsersForCopy,
        questionNumber: worksheetCopy.panelNumber,
      });
      const scoreResult = await score.save();
      scoresForAssignment.push(scoreResult._id);
      const studentInClassroom = await User.findById(student);
      studentInClassroom.scores.push(scoreResult._id);
      await studentInClassroom.save();
    }

    console.log(scoresForAssignment);

    const assignmentToAddScores = await Assignment.findById(
      assignmentResult._id
    );

    assignmentToAddScores.scores = scoresForAssignment;

    const finalAssignmentResult = await assignmentToAddScores.save();

    const newAssignment = await Assignment.findById(
      finalAssignmentResult._id
    ).populate({
      path: "scores",
      model: "Score",
      populate: {
        path: "student",
        model: "User",
      },
    });

    console.log(newAssignment);

    res.status(200).json({
      message: "Successfully created new assignment!",
      assignment: newAssignment,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAssignedWorksheets = async (req, res, next) => {
  console.log("get assigned sheetz!!");
  const userId = req.headers.userid;
  try {
    const student = await User.findById(userId).populate({
      path: "scores",
      model: "Score",
      populate: {
        path: "assignment",
        model: "Assignment",
      },
    });
    console.log(student.scores);
    const classroomsAssigned = student.classroomsAsStudent;
    console.log(classroomsAssigned);
    const assignedWorksheets = await Assignment.find({
      classroomsAssigned,
    });
    res.status(200).json({
      message: "successfully retreived assigned worksheets",
      assignedWorksheets,
      scores: student.scores,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getStudentWorksheet = async (req, res, next) => {
  console.log("get that worksheet!");
  const assignmentId = req.params.assignmentId;
  console.log(assignmentId, "hey");
  const userId = req.headers.userid;
  try {
    const user = await User.findById(userId);
    const existingScore = await Score.findOne({
      assignment: assignmentId,
      student: userId,
    });
    console.log(existingScore);
    const assignment = await Assignment.findById(assignmentId);
    if (!existingScore) {
      //   const answers = {};
      //   for (let i = 0; i < assignment.worksheet.panelNumber; i++) {
      //     answers["question" + (i + 1)] = {
      //       answer: "",
      //       answerWasAttempted: false,
      //       showPanel: true,
      //       isCorrect: false,
      //     };
      //   }
      const questionAnswers = assignment.worksheet.questionAnswers;
      const score = new Score({
        assignment: assignmentId,
        student: userId,
        questionAnswers,
        questionNumber: assignment.worksheet.panelNumber,
      });

      const scoreResult = await score.save();

      //   const classroom = await Classroom.findById(assignment.classroomAssigned);
      //   classroom.students.map(async (studentId) => {
      //     const student = await User.findById(studentId);
      //     student.scores.push(result._id);
      //     await student.save();
      //   });

      assignment.scores.push(scoreResult._id);
      await assignment.save();
      user.scores.push(scoreResult._id);
      await user.save();

      res.status(200).json({
        message: "new score created! Retreived blank answer template",
        assignment,
        questionAnswers,
        score,
      });
    } else {
      res.status(200).json({
        message: "retreived existing answers!",
        questionAnswers: existingScore.questionAnswers,
        assignment,
        score: existingScore,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.putUpdateStudentAnswers = async (req, res, next) => {
  const scoreId = req.body.data.scoreId;
  const questionAnswers = req.body.data.questionAnswers;
  try {
    const score = await Score.findById(scoreId);
    const assignment = await Assignment.findById(score.assignment);
    const dueDate = assignment.dueDate;
    if (new Date(dueDate) < new Date()) {
      res.status(200).json({
        message: "Sorry, this worksheet is no longer available",
        isLate: true,
      });
    } else {
      score.questionAnswers = questionAnswers;
      const result = await score.save();
      res.status(200).json({ message: "Answers saved!" });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.deleteAssignment = async (req, res, next) => {
  const assignmentId = req.body.assignmentId;
  console.log("hello friends!", assignmentId);

  // When assignments are deleted, delete associated Scores (in 2 places: Scores and Student.scores)
  try {
    const assignmentScores = await Score.find({ assignment: assignmentId });
    if (!assignmentScores) {
      const error = new Error("Failed to find associated scores");
      error.statusCode = 404;
      throw error;
    }

    for (let score of assignmentScores) {
      const studentId = score.student;
      const student = await User.findById(studentId);
      student.scores.pull(score._id);
      const studentResult = await student.save();
      console.log(studentResult);
    }
    const scoreResult = await Score.deleteMany({ assignment: assignmentId });
    console.log(scoreResult);
    const assignmentResult = await Assignment.findByIdAndDelete(assignmentId);
    console.log(assignmentResult);
    res.status(200).json({
      message: "Assignment successfully deleted!",
      assignmentId,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.putEditAssignmentName = async (req, res, next) => {
  const assignmentId = req.params.assignmentId;
  const editedName = req.body.editedName;
  try {
    const assignment = await Assignment.findById(assignmentId);
    assignment.assignmentName = editedName;
    result = await assignment.save();
    res
      .status(200)
      .json({ message: "edited name", assignmentName: result.assignmentName });
  } catch (err) {
    console.log(err);
  }
};
