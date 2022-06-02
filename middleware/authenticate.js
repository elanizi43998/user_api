var jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    let error = { msg: 'Unauthorized request you need to login !! ' };
    return res.status(401).send(error);
  }
  try {
    let token = req.headers.authorization.split(' ')[1];
    let decoded = jwt.verify(token.toString(), process.env.JWT_SECRET_KEY);
    req.user = decoded;
    return next();
  } catch (error) {
    console.log(error);
  }
};

exports.userPermission = (req, res, next) => {
  let { id } = req.params;
  let { user_id } = req.user;

  if (user_id === +id) {
    return next();
  } else {
    let error = {
      msg: 'Unauthorized request, you are not allowed to perform this operation !!',
    };
    return res.status(401).send(error);
  }
};
