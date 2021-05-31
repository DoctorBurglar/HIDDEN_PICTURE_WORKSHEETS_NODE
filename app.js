const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const helmet = require("helmet");
const compression = require(compression());

const assignmentsRoutes = require("./routes/assignments");
const worksheetsRoute = require("./routes/worksheets");
const authRoutes = require("./routes/auth");
const classroomsRoutes = require("./routes/classrooms");

const app = express();

// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "images");
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().toISOString() + "-" + file.originalname);
//   },
// });

const fileFilter = (res, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/gif"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

mongoose.set("useUnifiedTopology", true);

app.use(helmet());
app.use(compression());

app.use(bodyParser.json());
app.use(multer({ fileFilter }).single("mainImage"));
// app.use("/images", express.static(path.join(__dirname, "/images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, userId"
  );
  next();
});

app.use(worksheetsRoute);
app.use("/auth", authRoutes);
app.use(classroomsRoutes);
app.use(assignmentsRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  const isError = true;
  res.status(status).json({ message, data, isError });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.7jxyn.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`,
    { useNewUrlParser: true }
  )
  .then((result) => {
    app.listen(process.env.PORT || 8080);
  })
  .catch((err) => {
    console.log(err);
  });

mongoose.connection.on("error", function (error) {
  console.error("Database connection error", error);
});

mongoose.connection.once("open", function () {
  console.log("Database connected");
});
