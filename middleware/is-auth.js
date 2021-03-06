const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");

module.exports = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://dev-c67jht6b.us.auth0.com/.well-known/jwks.json`,
  }),

  audience: "http://hiddenpictureAPI.com",
  issuer: "https://dev-c67jht6b.us.auth0.com/",
  algorithms: ["RS256"],
});

// module.exports = (req, res, next) => {
//     const authHeader = req.get('Authorization');
//     if (!authHeader) {
//         const error = new Error('Not Authenticated');
//         error.statusCode = 401;
//         throw error;
//     }
//     const token = authHeader.split(' ')[1];
//     let decodedToken;
//     try {
//         decodedToken = jwt.verify(token, 'babybelugainthedeepblueseayouswimsowildandyouswimsofree');
//     } catch (err) {
//         err.statusCode = 500;
//         throw err;
//     }
//     if (!decodedToken) {
//         const error = new Error('Not authenticated');
//         error.statusCode = 401;
//         throw err;
//     }
//     req.userId = decodedToken.userId;
//     next();
// }
