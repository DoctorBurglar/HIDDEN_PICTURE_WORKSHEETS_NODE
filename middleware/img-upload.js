const { Storage } = require("@google-cloud/storage");

const gcs = new Storage({
  projectId: "auth0-test-project-293906", //my project id
  keyFilename: "./auth0-test-project-293906-78fb1bbeb6a0.json", //path to keyfile.json
});

const bucketName = "hiddenpictureworksheets"; //the bucket's name for the upload
const bucket = gcs.bucket(bucketName);

const getPublicUrl = (filename) => {
  return "https://storage.googleapis.com/" + bucketName + "/" + filename;
};

let imgUpload = {};

imgUpload.uploadToGcs = (req, res, next) => {
  console.log("made it here boyee!");
  if (!req.file) return next();

  const gcsname = req.file.originalname;
  const file = bucket.file(gcsname);

  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  stream.on("error", (err) => {
    req.file.cloudStorageError = err;
    next(err);
  });

  stream.on("finish", () => {
    req.file.cloudStorageObject = gcsname;
    req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
    next();
  });

  stream.end(req.file.buffer);
};

module.exports = imgUpload;
