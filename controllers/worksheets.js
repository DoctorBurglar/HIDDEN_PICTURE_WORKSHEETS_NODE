const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const io = require("../socket");
const Worksheet = require("../models/worksheet");
const Folder = require("../models/folder");
const User = require("../models/user");
const Assignment = require("../models/assignment");
const { validationResult } = require("express-validator");
const { get } = require("http");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

exports.getWorksheets = async (req, res, next) => {
  const userId = req.headers.userid;
  try {
    const user = await User.findById(userId)
      .select("folders worksheets")
      .populate({
        path: "folders",
        model: "Folder",
      })
      .populate({
        path: "worksheets",
        select: "worksheetName parent",
        model: "Worksheet",
      });
    const worksheetNames = user.worksheets;
    const folders = user.folders;
    res.status(200).json({
      message: "retreived worksheets successfully",
      worksheetNames,
      folders,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postWorksheet = async (req, res, next) => {
  console.log(req.body.parent);
  let imageUrl;
  if (req.file && req.file.cloudStoragePublicUrl) {
    imageUrl = req.file.cloudStoragePublicUrl;
  }
  console.log(imageUrl, "yippee!!");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Please check to make sure you entered valid data");
    error.statusCode = 422;
    throw error;
  }
  if (!req.body.mainImageUrl && !req.file) {
    const error = new Error("Please upload an image or enter an image URL");
    error.statusCode = 422;
    throw error;
  }
  const userId = req.headers.userid;
  const worksheetName = req.body.worksheetName;
  const panelNumber = req.body.panelNumber;
  let parent = null;
  if (req.body.parent) {
    parent = req.body.parent;
  }

  let mainImageUrl = req.body.mainImageUrl;
  if (imageUrl) {
    mainImageUrl = imageUrl;
  }

  const panelImageUrl = req.body.panelImageUrl;
  const questionAnswers = {};
  for (let i = 1; i <= panelNumber; i++) {
    questionAnswers["question" + i] = {
      question: "",
      answer: "",
      answerKey: "",
      showPanel: true,
    };
  }
  const worksheet = new Worksheet({
    worksheetName,
    panelNumber,
    mainImageUrl,
    panelImageUrl,
    questionAnswers,
    createdBy: userId,
    parent,
  });
  try {
    const worksheetResult = await worksheet.save();
    console.log(worksheetResult);
    const teacher = await User.findById(userId);
    teacher.worksheets.push(worksheetResult._id);
    const teacherResult = await teacher.save();

    const newWorksheetName = await Worksheet.findById(
      worksheetResult._id
    ).select("worksheetName parent");

    res.status(200).json({
      message: "worksheet created successfully",
      newWorksheetName,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getWorksheet = (req, res, next) => {
  const worksheetId = req.params.worksheetId;
  // const googleId = req.user.sub.split("|")[1];
  const userId = req.headers.userid;
  console.log(userId);
  Worksheet.findById(worksheetId)
    .then((worksheet) => {
      if (!worksheet) {
        const error = new Error("Could not find worksheet");
        error.statusCode = 404;
        throw error;
      }
      if (worksheet.createdBy.toString() !== userId.toString()) {
        const error = new Error("Not authorized to view this worksheet");
        error.statusCode = 401;
        throw error;
      }
      res.status(200).json({
        message: "worksheet successfully retreived",
        worksheet,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.patchUpdateWorksheet = (req, res, next) => {
  const userId = req.headers.userid;
  console.log(userId);
  const worksheetId = req.body.data.worksheetId;
  const questionAnswers = req.body.data.questionAnswers;
  Worksheet.findById(worksheetId)
    .then((worksheet) => {
      if (!worksheet) {
        const error = new Error("Could not update worksheet");
        error.statusCode = 404;
        throw error;
      }
      console.log(worksheet.createdBy);
      if (worksheet.createdBy.toString() !== userId.toString()) {
        const error = new Error(
          "Not authorized to save changes to this worksheet"
        );
        error.statusCode = 401;
        throw error;
      }
      worksheet.questionAnswers = questionAnswers;
      return worksheet.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "Changes saved",
        result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.putEditWorksheet = (req, res, next) => {
  // const googleId = req.user.sub.split("|")[1];
  const userId = req.headers.userid;
  console.log(userId);
  const worksheetId = req.params.worksheetId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Please check to make sure you entered valid data");
    error.statusCode = 422;
    throw error;
  }
  const worksheetName = req.body.worksheetName;
  const mainImageUrl = req.body.mainImageUrl;
  const panelImageUrl = req.body.panelImageUrl;
  Worksheet.findById(worksheetId)
    .then((worksheet) => {
      if (!worksheet) {
        const error = new Error("could not retreive worksheet to update");
        error.statusCode = 404;
        throw error;
      }
      if (worksheet.createdBy.toString() !== userId.toString()) {
        const error = new Error("Not authorized to edit worksheet");
        error.statusCode = 401;
        throw error;
      }
      if (req.file) {
        clearImage(worksheet.mainImage);
        worksheet.mainImage = req.file.path;
      }
      if (!worksheet.mainImage) {
        worksheet.mainImage = "";
      }
      worksheet.worksheetName = worksheetName;
      worksheet.mainImageUrl = mainImageUrl;
      worksheet.panelImageUrl = panelImageUrl;
      return worksheet.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "worksheet successfully updated",
        worksheet: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteWorksheet = async (req, res, next) => {
  const userId = req.headers.userid;
  const worksheetId = req.params.worksheetId;
  console.log(worksheetId);

  try {
    const assignmentsDependingOnWorksheet = await Assignment.find({
      worksheet: worksheetId,
    });
    if (assignmentsDependingOnWorksheet.length > 0) {
      const error = new Error(
        "Deletion failed.  This worksheet is being used for an active assignment. If you want to delete this worksheet, first delete any active assignments that use this worksheet"
      );
      error.statusCode = 403;
      throw error;
    }
    console.log(assignmentsDependingOnWorksheet, "butts");
    const worksheet = await Worksheet.findById(worksheetId);

    if (!worksheet) {
      const error = new Error("No worksheet found to delete");
      error.statusCode = 404;
      throw error;
    }
    if (worksheet.createdBy.toString() !== userId.toString()) {
      const error = new Error("Not authorized to delete this worksheet");
      error.statusCode = 401;
      throw error;
    }
    // clearImage(worksheet.mainImage);
    const worksheetResult = await Worksheet.findByIdAndRemove(worksheetId);
    console.log(worksheetResult, "worksheet result");
    const teacher = await User.findById(userId);
    teacher.worksheets.pull({ _id: worksheetId });
    const teacherResult = await teacher.save();
    res.status(200).json({
      message: "Worksheet deleted.",
      deletedWorksheetId: worksheetResult._id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postSendSharedWorksheet = async (req, res, next) => {
  // TODO fix this function.  Find a way to make it less convoluted.
  const sharedEmail = req.body.data.email;
  // const googleId = req.user.sub.split("|")[1];
  const userId = req.headers.userid;
  const teacherName = req.user["https://hiddenpicturetest.com/name"];
  const worksheetId = req.body.data.worksheetId;
  console.log(sharedEmail, userId, teacherName, worksheetId);

  try {
    const sharingUser = await User.findById(userId);
    if (!sharingUser) {
      const error = new Error(
        "Something went wrong, couldn't find sharing user"
      );
      error.statusCode = 404;
      throw error;
    }

    const sharedUser = await User.findOne({ email: sharedEmail });
    // check if shared user is a teacher
    if (sharedUser && !sharedUser.roles.includes("teacher")) {
      const error = new Error(
        "Not sent- worksheets can only be shared with teachers.  Use the assign button to send to students."
      );
      error.statusCode = 404;
      throw error;
    }

    //existingWorksheet is the version that gets shared.  The new copy will be kept by the sharer
    const existingWorksheet = await Worksheet.findById(worksheetId);
    if (!existingWorksheet) {
      const error = new Error(
        "Something went wrong, couldn't find worksheet to share"
      );
      error.statusCode = 404;
      throw error;
    }
    // mark that the existing worksheet is ready to be claimed.
    existingWorksheet.createdBy = null;

    // clear the answers of the existing worksheet to be shared.  (questions and answerKeys are still there)
    const questionAnswersWithClearedAnswers = {};
    for (
      let i = 1;
      i <= Object.keys(existingWorksheet.questionAnswers).length;
      i++
    ) {
      questionAnswersWithClearedAnswers["question" + i] = {
        ...existingWorksheet.questionAnswers["question" + i],
        answer: "",
      };
    }

    // new copy is kept by sharer (This is so changes made after sharing aren't then also shared)
    const newWorksheet = new Worksheet({
      worksheetName: existingWorksheet.worksheetName,
      panelNumber: existingWorksheet.panelNumber,
      mainImageUrl: existingWorksheet.mainImageUrl,
      mainImage: existingWorksheet.mainImage,
      panelImageUrl: existingWorksheet.panelImageUrl,
      questionAnswers: existingWorksheet.questionAnswers,
      // new worksheet is assigned to sharer
      createdBy: userId,
    });

    //apply cleared answers to worksheet being saved
    existingWorksheet.questionAnswers = questionAnswersWithClearedAnswers;
    const sharedWorksheetResult = await existingWorksheet.save();
    const newWorksheetResult = await newWorksheet.save();

    sharingUser.worksheets.pull({ _id: worksheetId });
    sharingUser.worksheets.push(newWorksheetResult._id);
    const sharingUserResult = await sharingUser.save();

    if (!sharedUser) {
      const result = await transporter.sendMail({
        to: sharedEmail,
        from: "stevelorentzen@gmail.com",
        subject: `${teacherName} shared a worksheet with you!`,
        html: `<div>
                      <h1> ${teacherName} has shared a worksheet with you.  Click the link below to create an account and accept the worksheet:</h1>
                      <a href='http://localhost:3000/accept-worksheet/${worksheetId}'>Sign Up and accept worksheet</a>
                  </div>`,
      });
      res
        .status(200)
        .json({ message: "successfully shared worksheet and sign up link" });
    } else {
      const result = await transporter.sendMail({
        to: sharedEmail,
        from: "stevelorentzen@gmail.com",
        subject: `${teacherName} shared a worksheet with you!`,
        html: `<div>
                          <h1> ${teacherName} has shared a worksheet with you.  Click the link below to accept the worksheet </h1>
                          <a href='http://localhost:3000/accept-worksheet/${worksheetId}'>Accept worksheet!</a>
                      </div>`,
      });
      res.status(200).json({ message: "successfully shared worksheet" });
    }
    // send email to existing user with option to join classroom
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postAcceptSharedWorksheet = async (req, res, next) => {
  console.log(req.body, "datadatadatadatadatadatadatadatadatadatadatadatadata");
  const googleId = req.user.sub.split("|")[1];
  const userId = req.headers.userid;
  const worksheetId = req.body.data.worksheetId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("something went wrong, couldn't find user");
      error.statusCode = 404;
      throw error;
    }
    const sharedWorksheet = await Worksheet.findById(worksheetId);
    if (!sharedWorksheet) {
      const error = new Error("something went wrong, couldn't find worksheet");
      error.statusCode = 404;
      throw error;
    }
    sharedWorksheet.createdBy = googleId;

    const worksheetResult = await sharedWorksheet.save();
    console.log(worksheetResult, "okay buddy");
    user.worksheets.push(worksheetResult._id);
    const userResult = await user.save();
    res.status(200).json({
      message: `You successfully received the worksheet "${worksheetResult.worksheetName}"!`,
      worksheet: {
        worksheetName: worksheetResult.worksheetName,
        _id: worksheetResult._id,
      },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postNewFolder = async (req, res, next) => {
  console.log(req.body.data.folderName);
  const folderName = req.body.data.folderName;
  const userId = req.headers.userid;
  const parentId = req.body.data.parent;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Failed to find user to add folder to");
      error.statusCode = 404;
      throw error;
      ``;
    }
    let folder;
    if (req.body.data.parent) {
      folder = new Folder({
        name: folderName,
        user: user._id,
        parent: parentId,
      });
    } else {
      folder = new Folder({
        name: folderName,
        user: user._id,
      });
    }

    const folderResult = await folder.save();
    user.folders.push(folderResult._id);
    await user.save();
    res
      .status(200)
      .json({ message: "new folder created!", folder: folderResult });
  } catch (err) {
    console.log(err);
  }
};

exports.putAddToFolder = async (req, res, next) => {
  const googleId = req.user.sub.split("|")[1];
  const targetFolderId = req.body.targetFolder;
  const movedItem = req.body.movedItem;
  console.log(targetFolderId, movedItem);
  let message;
  let folderResult;
  let worksheetResult;
  try {
    if (movedItem.type === "folder") {
      const folder = await Folder.findById(movedItem.id);
      folder.parent = targetFolderId;
      folderResult = await folder.save();
      message = "added folder to folder";
    }
    if (movedItem.type === "worksheet") {
      const worksheet = await Worksheet.findById(movedItem.worksheetId);
      console.log("worksheet:", worksheet);
      worksheet.parent = targetFolderId;
      worksheetResult = await worksheet.save();
      message = "added worksheet to folder";
    }
    console.log(folderResult, worksheetResult);

    if (movedItem.type === "folder") {
      res.status(200).json({ message, updatedFolder: folderResult });
    }
    if (movedItem.type === "worksheet") {
      res.status(200).json({ message, updatedWorksheet: worksheetResult });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.deleteFolder = async (req, res, next) => {
  const folderId = req.params.folderId;
  const userId = req.headers.userid;
  let foldersToDelete = [folderId];
  let worksheetsToDelete = [];

  try {
    const user = await User.findById(userId)
      .select("folders worksheets")
      .populate({
        path: "folders",
        select: "parent",
        model: "Folder",
      })
      .populate({
        path: "worksheets",
        select: "parent",
        model: "Worksheet",
      });
    console.log(user.worksheets, "user/worksheets");
    const folders = user.folders;
    const worksheets = user.worksheets;
    console.log(folders, "folders");

    function checkFoldersForChildren(arr) {
      console.log(arr, "arr");
      if (arr.length === 0) {
        return;
      }

      let childFolders = folders.filter((folder) => {
        if (folder.parent) {
          return folder.parent.toString() === arr[0].toString();
        }
      });
      const childFolderIds = [];
      childFolders.forEach((folder) => {
        childFolderIds.push(folder._id);
        foldersToDelete.push(folder._id);
      });
      // foldersToDelete = foldersToDelete.concat(childFolderIds);

      let childWorksheets = worksheets.filter((worksheet) => {
        if (worksheet.parent) {
          return worksheet.parent.toString() === arr[0].toString();
        }
      });
      childWorksheets.forEach((worksheet) => {
        worksheetsToDelete.push(worksheet._id);
      });

      if (childFolders.length > 0) {
        checkFoldersForChildren(childFolderIds);
      }
      checkFoldersForChildren(arr.slice(1));
    }
    checkFoldersForChildren([folderId]);
    console.log(foldersToDelete, "foldersToDelete");

    foldersToDelete.forEach(async (folder) => {
      user.folders.pull({ _id: folder }); //TODO: test this!
      await Folder.findByIdAndDelete(folder);
    });

    console.log(worksheetsToDelete, "worksheetsToDelete");

    worksheetsToDelete.forEach(async (worksheet) => {
      user.worksheets.pull({ _id: worksheet });
      await Worksheet.findByIdAndDelete(worksheet);
    });

    console.log(user.folders);

    const result = await user.save(); // need to test if this works too ^^^

    const updatedUser = await User.findById(userId).select("folders").populate({
      path: "folders",
      model: "Folder",
    });

    console.log(updatedUser.folders);
    res.status(200).json({
      message: "successfully deleted folder",
      folders: updatedUser.folders,
      deletedWorksheets: worksheetsToDelete,
      deletedFolders: foldersToDelete,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.postAssignWorksheet = (req, res, next) => {};
