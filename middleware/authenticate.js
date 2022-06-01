var jwt = require('jsonwebtoken');

verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    var error = { msg: 'Unauthorized request' };
    return res.status(401).send(error);
  }
  try {
    var token = req.headers.authorization.split(' ')[1];
    var decoded = jwt.verify(token.toString(), process.env.JWT_SECRET_KEY);
    req.user = decoded;
    return next();
  } catch (error) {
    console.log(error);
  }
};

module.exports = verifyToken;
