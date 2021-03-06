const express = require("express");
const checkJwt = require("../middleware/is-auth");
const checkIsTeacher = require("../middleware/is-teacher");

const router = express.Router();

const classroomsController = require("../controllers/classrooms");

router.get(
  "/get-classrooms",
  checkJwt,
  checkIsTeacher,
  classroomsController.getClassrooms
);

router.post(
  "/create-classroom",
  checkJwt,
  checkIsTeacher,
  classroomsController.postCreateClassroom
);

router.delete(
  "/delete-classroom",
  checkJwt,
  checkIsTeacher,
  classroomsController.deleteClassroom
);

router.get(
  "/get-students/:classroomId",
  checkJwt,
  checkIsTeacher,
  classroomsController.getStudents
);

router.delete(
  "/delete-student",
  checkJwt,
  checkIsTeacher,
  classroomsController.deleteStudent
);

module.exports = router;
