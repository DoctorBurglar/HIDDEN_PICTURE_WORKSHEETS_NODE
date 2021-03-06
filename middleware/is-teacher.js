module.exports = (req, res, next) => {
  console.log(req);
  const roles = req.user["https://hiddenpicturetest.com/roles"];
  console.log(roles);
  if (!roles.includes("teacher")) {
    const error = new Error("Not authorized");
    error.statusCode = 403;
    throw error;
  } else {
    next();
  }
};
