const express = require("express");
const { body } = require("express-validator");
const checkJwt = require("../middleware/is-auth");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.post("/create-user", checkJwt, authController.postCreateUser);

router.get(
  "/check-classroom-code/:classroomCode",
  authController.getCheckClassroomCode
);

module.exports = router;
