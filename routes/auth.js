const express = require("express");
const { body } = require("express-validator");
const checkJwt = require("../middleware/is-auth");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.post("/create-user", checkJwt, authController.postCreateUser);

// router.post(
//   "/create-student/:classroomToJoin",
//   checkJwt,
//   authController.postCreateStudent
// );

router.get(
  "/check-classroom-code/:classroomCode",
  authController.getCheckClassroomCode
);

// router.put(
//   "/signup",
//   [
//     body("email")
//       .trim()
//       .isEmail()
//       .withMessage("Please enter a valid email address")
//       .custom((value, { req }) => {
//         return User.findOne({ email: value }).then((userDoc) => {
//           if (userDoc) {
//             return Promise.reject("email address already exists");
//           }
//         });
//       })
//       .normalizeEmail(),
//     body("password").trim().isLength({ min: 5 }),
//     body("name").trim().not().isEmpty(),
//   ],
//   authController.signup
// );

// router.post("/login", authController.login);

module.exports = router;
