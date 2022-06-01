var express = require('express');
var router = express.Router();
var argon = require('argon2');

var jwt = require('jsonwebtoken');
var auth = require('../middleware/authenticate');

var { PrismaClient, Prisma } = require('@prisma/client');
var prisma = new PrismaClient();

router
  .get('/', async function (req, res, next) {
    var users = await prisma.user.findMany({});
    console.log(users);
    res.send(users);
  })
  .post('/login', async function (req, res, next) {
    var { userName, password } = req.body;
    var user = await prisma.user.findUnique({
      where: { userName },
    });
    if (user && (await argon.verify(user.hash, password))) {
      var token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET_KEY, {
        expiresIn: '5h',
      });
      user.token = token;
      res.json(user.token);
    } else {
      res.status(400).send('Wa hia!!');
    }
  })
  .post('/', async function (req, res, next) {
    let { nom, userName, password, prenom } = req.body;
    userName = userName.toLowerCase();
    try {
      const hash = await argon.hash(password);
      var user = await prisma.user.create({
        data: {
          nom,
          userName,
          hash,
          prenom,
        },
      });
      delete user.hash;
      var token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET_KEY, {
        expiresIn: '5h',
      });
      user.token = token;
      res.json(user.token);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          let error = {
            msg: 'This user already exists !!',
          };
          res.json(error);
        }
      } else {
        console.log(error);
      }
    }
  })
  .get('/:id', auth,async (req, res, next) => {
    var { id } = req.params;

    var id = +id;
    var user = await prisma.user.findUnique({
      where: { id },
      include: {
        cars: true,
      },
    });
    if (user) {
      delete user.hash;
      res.json(user);
    } else {
      let error = {
        msg: 'User does not exist !!',
      };
      res.json(error);
    }
  })
  .put('/:id', auth, async (req, res, next) => {
    var { id } = req.params;
    var data = req.body;
    var id = +id;
    var user = await prisma.user.update({
      where: { id },
      data,
    });
    delete user.hash;
    delete user.id;
    res.json(user);
  });

module.exports = router;
