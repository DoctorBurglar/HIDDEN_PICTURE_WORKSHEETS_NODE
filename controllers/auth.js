const { validationResult } = require("express-validator");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Classroom = require("../models/classroom");
const { create } = require("../models/user");
const { json } = require("body-parser");

exports.getCheckClassroomCode = async (req, res, next) => {
  console.log("hello buddy");
  const classroomCode = req.params.classroomCode;
  console.log(classroomCode);
  try {
    const classroom = await Classroom.findOne({ code: classroomCode });
    if (!classroom) {
      res.status(404).json({
        message: "Invalid classroom code",
        codeIsValid: false,
      });
    } else {
      console.log("yeah buddy");
      res.status(200).json({
        message: "Classroom code successfully validated!",
        codeIsValid: true,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

// exports.postCreateStudent = async (req, res, next) => {
//   let classroomToJoin;
//   //   if (req.body.classroomToJoin) {
//   //     classroomToJoin = req.body.classroomToJoin;
//   //   }
//   console.log("goose!!!");
//   const userId = req.user.sub.split("|")[1];
//   const name = req.user["https://hiddenpicturetest.com/name"];
//   const email = req.user["https://hiddenpicturetest.com/email"];
//   const profilePicture = req.user["https://hiddenpicturetest.com/picture"];
//   const roles = req.user["https://hiddenpicturetest.com/roles"];

//   try {
//     const user = await User.findOne({ googleId: userId });
//     if (!user) {
//       let classroomCode = null;
//       if (roles.includes("teacher")) {
//         classroomCode = createClassroomCode(6);
//       }
//       const user = new User({
//         googleId: userId,
//         name,
//         email,
//         roles,
//         worksheets: [],
//         profilePicture,
//         assigned: [],
//         classroomCode,
//         classroomJoined: classroomToJoin,
//       });
//       const result = await user.save();
//       console.log(result);
//       res.status(200).json({
//         message: "created new user successfully",
//         classroomCode,
//       });
//     } else {
//       res.status(200).json({
//         message: "confirmed user exists",
//         classroomCode: user.classroomCode,
//       });
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

exports.postCreateUser = async (req, res, next) => {
  const userId = req.user.sub.split("|")[1];
  const name = req.user["https://hiddenpicturetest.com/name"];
  const email = req.user["https://hiddenpicturetest.com/email"];
  const profilePicture = req.user["https://hiddenpicturetest.com/picture"];
  const roles = req.user["https://hiddenpicturetest.com/roles"];

  let classroom = null;
  let teacher;

  // check if joining a classroom
  if (req.body.classroomToJoin) {
    classroomToJoin = req.body.classroomToJoin;
    try {
      classroom = await Classroom.findOne({ code: classroomToJoin });
      if (!classroom) {
        const error = new Error("No classroom found, invalid code");
        error.statusCode = 404;
        throw error;
      }
      teacher = await User.findById(classroom.teacher);
      if (!teacher) {
        const error = new Error("Something went wrong, couldn't find teacher");
        error.statusCode = 404;
        throw error;
      }
    } catch (err) {
      console.log(err);
    }
  }

  try {
    const user = await User.findOne({ googleId: userId });
    if (!user) {
      // let classroomCode = null;
      // if (roles.includes("teacher")) {
      //   classroomCode = createClassroomCode(6);
      // }
      const user = new User({
        googleId: userId,
        name,
        email,
        roles,
        worksheets: [],
        folders: [],
        profilePicture,
        assigned: [],
        classroomsAsTeacher: [],
        classroomsAsStudent: [],
      });

      if (classroom && teacher) {
        user.classroomsAsStudent.push(classroom._id);
      }
      const userResult = await user.save();
      console.log(userResult._id);

      if (classroom && teacher) {
        classroom.students.push(userResult._id);
        await classroom.save();
        teacher.students.push(userResult._id);
        await teacher.save();
      }

      let message = "created new user successfully";

      if (classroom && teacher) {
        message = "created new user successfully and added user to classroom";
      }

      res.status(200).json({
        message,
        userId: userResult._id,
      });
    } else {
      if (classroom && teacher) {
        user.classroomsAsStudent.push(classroom._id);
        const result = await user.save();
        let message = "Successfully added existing user to classroom";
        if (!classroom.students.includes(result._id)) {
          classroom.students.push(result._id);
          await classroom.save();
        } else {
          message += " ,student already in class roster";
        }
        if (!teacher.students.includes(result._id)) {
          teacher.students.push(result._id);
          await teacher.save();
        } else {
          message += " ,student already in teacher roster";
        }
        res.status(200).json({
          message,
          classroomCode: user.classroomCode,
          userId: user._id,
        });
      } else {
        res.status(200).json({
          message: "Confirmed that user exists",
          classroomCode: user.classroomCode,
          userId: user._id,
        });
      }
    }
  } catch (err) {
    console.log(err);
  }
};

// exports.signup = (req, res, next) => {
//   console.log("hello");
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     const error = new Error("validation failed");
//     error.statusCode = 422;
//     error.data = errors.array();
//     throw error;
//   }
//   const email = req.body.email;
//   const password = req.body.password;
//   const name = req.body.name;
//   const isTeacher = req.body.isTeacher;
//   bcrypt
//     .hash(password, 12)
//     .then((hashedPassword) => {
//       const user = new User({
//         email,
//         name,
//         password: hashedPassword,
//         isTeacher,
//       });
//       return user.save();
//     })
//     .then((result) => {
//       res
//         .status(201)
//         .json({ message: "user created successfully", userId: result._id })
//         .catch((err) => {
//           if (!err.statusCode) {
//             err.statusCode = 500;
//           }
//           next(err);
//         });
//     });
// };

// exports.login = (req, res, next) => {
//   const email = req.body.email;
//   const password = req.body.password;
//   let loadedUser;
//   User.findOne({ email: email })
//     .then((user) => {
//       if (!user) {
//         const error = new Error("Couldn't find a user with that email");
//         error.statusCode = 401;
//         throw error;
//       }
//       loadedUser = user;
//       return bcrypt.compare(password, user.password);
//     })
//     .then((isEqual) => {
//       if (!isEqual) {
//         const error = new Error("Wrong password");
//         error.statusCode = 401;
//         throw error;
//       }
//       const token = jwt.sign(
//         {
//           email: loadedUser.email,
//           userId: loadedUser._id.toString(),
//         },
//         "babybelugainthedeepblueseayouswimsowildandyouswimsofree",
//         { expiresIn: "1h" }
//       );
//       res.status(200).json({
//         message: "login successful!",
//         token,
//         userId: loadedUser._id.toString(),
//       });
//     })
//     .catch((err) => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     });
// };

// const createClassroomCode = (length) => {
//   let chars = "abcdefghijklmnopqrstuvwxyz123456789";
//   let codeArray = [];
//   for (let i = 0; i < length; i++) {
//     codeArray[i] = chars[Math.floor(Math.random() * 35)];
//   }
//   return codeArray.join("");
// };
