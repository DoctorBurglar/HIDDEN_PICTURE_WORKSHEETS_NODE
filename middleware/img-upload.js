const {Storage} = require("@google-cloud/storage");

const gcs = new Storage({
  projectId: process.env.PROJECT_ID, //my project id
  keyFilename: process.env.PATH_TO_KEYFILE, //path to keyfile.json
});

const bucketName = process.env.BUCKET_NAME; //the bucket's name for the upload
const bucket = gcs.bucket(bucketName);

const getPublicUrl = (filename) => {
  return process.env.STORAGE_URL + bucketName + "/" + filename;
};

let imgUpload = {};

imgUpload.uploadToGcs = (req, res, next) => {
  if (!req.file) return next();

  const gcsname = req.file.originalname;
  const file = bucket.file(gcsname);
  console.log(file);
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
