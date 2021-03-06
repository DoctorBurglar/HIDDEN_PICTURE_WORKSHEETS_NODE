const express = require("express");
const { body } = require("express-validator");

const checkIsTeacher = require("../middleware/is-teacher");
const checkJwt = require("../middleware/is-auth");
const imgUpload = require("../middleware/img-upload");

const router = express.Router();

const worksheetController = require("../controllers/worksheets");
const worksheet = require("../models/worksheet");

router.get("/worksheets", checkJwt, worksheetController.getWorksheets);

router.post(
  "/worksheet",
  imgUpload.uploadToGcs,
  checkJwt,
  checkIsTeacher,
  [
    body("worksheetName")
      .isLength({ min: 3 })
      .withMessage("Please enter a worksheet title at least 3 characters long"),
    // body('mainImageUrl').isURL().withMessage('Please enter a valid Url'),
    // body('panelImageUrl').isURL().withMessage('Please enter a valid Url'),
  ],
  worksheetController.postWorksheet
);

router.get(
  "/worksheet/:worksheetId",
  checkJwt,
  worksheetController.getWorksheet
);

router.patch(
  "/update-worksheet",
  checkJwt,
  checkIsTeacher,
  worksheetController.patchUpdateWorksheet
);

router.put(
  "/worksheet/:worksheetId",
  checkJwt,
  checkIsTeacher,
  [
    body("worksheetName")
      .isLength({ min: 3 })
      .withMessage("Please enter a worksheet title at least 3 characters long"),
    // body('mainImageUrl').isURL().withMessage('Please enter a valid Url'),
    // body('panelImageUrl').isURL().withMessage('Please enter a valid Url'),
  ],
  worksheetController.putEditWorksheet
);

router.delete(
  "/delete-worksheet/:worksheetId",
  checkJwt,
  checkIsTeacher,
  worksheetController.deleteWorksheet
);

router.post(
  "/send-shared-worksheet",
  checkJwt,
  checkIsTeacher,
  worksheetController.postSendSharedWorksheet
);

router.post(
  "/accept-shared-worksheet",
  (req, res, next) => {
    console.log(req.headers, 22222222222222222222222);
    next();
  },
  checkJwt,
  checkIsTeacher,
  worksheetController.postAcceptSharedWorksheet
);

router.post(
  "/assign-worksheet",
  checkJwt,
  checkIsTeacher,
  worksheetController.postAssignWorksheet
);

router.post(
  "/new-folder",
  checkJwt,
  checkIsTeacher,
  worksheetController.postNewFolder
);

// router.get(
//   "/open-folder/:folderId",
//   checkJwt,
//   checkIsTeacher,
//   worksheetController.getOpenFolder
// );

router.put(
  "/add-to-folder",
  checkJwt,
  checkIsTeacher,
  worksheetController.putAddToFolder
);

router.delete(
  "/delete-folder/:folderId",
  checkJwt,
  checkIsTeacher,
  worksheetController.deleteFolder
);

module.exports = router;
