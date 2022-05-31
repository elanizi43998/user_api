var express = require('express');
var router = express.Router();
var { PrismaClient, Prisma } = require('@prisma/client');
var argon = require('argon2');

var prisma = new PrismaClient();

router
  .get('/', async function (req, res, next) {
    var users = await prisma.user.findMany({});
    console.log(users);
    res.send(users);
  })
  .post('/singin', async function (req, res, next) {
    var { userName, password } = req.body;
    var user = await prisma.user.findUnique({
      where: { userName },
    });
    if (user) {
      var hash = await argon.verify(user.hash, password);
      // res.send(user);
      if (hash) {
        res.send('welcome');
      } else {
        res.send('Error');
      }
    } else {
      res.send('Wa hia!!');
    }
  })
  .post('/', async function (req, res, next) {
    var { nom, userName, password, prenom } = req.body;
    const hash = await argon.hash(password);
    try {
      var user = await prisma.user.create({
        data: {
          nom,
          userName,
          hash,
          prenom,
        },
      });
      delete user.hash;
      res.json(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          let error = {
            msg: 'This user already exists !!',
          };
          res.json(error);
        }
      }
    }
  })
  .get('/:id', async (req, res, next) => {
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
  .put('/:id', async (req, res, next) => {
    var { id } = req.params;
    var data = req.body;
    var id = +id;
    var user = await prisma.user.update({
      where: { id },
      data,
    });
    res.json(user);
  });

module.exports = router;
