var express = require('express');
var router = express.Router();
var { PrismaClient, Prisma } = require('@prisma/client');
var prisma = new PrismaClient();

router
  .get('/', (req, res, next) => {
    res.send('Hello from cars Route !!');
  })
  .post('/', async function (req, res, next) {
    var { nom, model, ownerId, type } = req.body;

    try {
      var car = await prisma.car.create({
        data: {
          nom,
          model,
          ownerId,
          type,
        },
      });
      res.json(car);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          let error = {
            msg: `This user already has a ${nom} ${model} !!`,
          };
          res.status(409);
          res.json(error);
        }
      }
    }
  });

module.exports = router;
