const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");

module.exports = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: process.env.JWKS_URI,
  }),

  audience: process.env.JWKS_AUDIENCE,
  issuer: process.env.JWKS_ISSUER,
  algorithms: [process.env.JWKS_ALGORITHMS],
});
