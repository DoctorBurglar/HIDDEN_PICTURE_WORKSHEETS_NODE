const express = require("express");
const checkJwt = require("../middleware/is-auth");
const checkIsTeacher = require("../middleware/is-teacher");

const router = express.Router();
const { body } = require("express-validator");

const assignmentsController = require("../controllers/assignments");

router.get(
  "/assignment-data",
  checkJwt,
  checkIsTeacher,
  assignmentsController.getAssignmentData
);

router.get(
  "/assignments",
  checkJwt,
  checkIsTeacher,
  assignmentsController.getAssignments
);

router.post(
  "/create-assignment",
  checkJwt,
  checkIsTeacher,
  [
    body("dueDate")
      .isLength({ min: 12 })
      .withMessage("Please enter a valid date."),
    body("assignmentName")
      .isLength({ min: 2 })
      .withMessage(
        "Please enter an assignment name at least 2 characters long."
      ),
    body("worksheet")
      .isMongoId()
      .withMessage("Please make sure you pick a valid worksheet."),
    body("classroomAssigned")
      .isMongoId()
      .withMessage("Please make sure you select a valid classroom."),
  ],
  assignmentsController.postCreateAssignment
);

router.get(
  "/assigned-worksheets",
  checkJwt,
  assignmentsController.getAssignedWorksheets
);

router.get(
  "/student-worksheet/:assignmentId",
  checkJwt,
  assignmentsController.getStudentWorksheet
);

router.put(
  "/update-student-answers",
  checkJwt,
  assignmentsController.putUpdateStudentAnswers
);

router.delete(
  "/delete-assignment",
  checkJwt,
  checkIsTeacher,
  assignmentsController.deleteAssignment
);

router.put(
  "/edit-assignment-name/:assignmentId",
  checkJwt,
  checkIsTeacher,
  assignmentsController.putEditAssignmentName
);

module.exports = router;
