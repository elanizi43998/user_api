var express = require('express');
var router = express.Router();
var argon = require('argon2');

var jwt = require('jsonwebtoken');
var auth = require('../middleware/authenticate');

var { PrismaClient, Prisma } = require('@prisma/client');
var prisma = new PrismaClient();

var { body, validationResult } = require('express-validator');
var nodeMailer = require('nodemailer');
/**
 * nodeMailer configuration
 */
var transporter = nodeMailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PSW,
  },
});

router
  .get('/', async function (req, res, next) {
    var users = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        userName: true,
        email: true,
        cars: true,
      },
    });
    // users.forEach((users) => {
    //   delete users.hash;
    // });
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
  .post(
    '/',
    body('email').isEmail({ min: 6 }),
    body('userName').isLength({ min: 5 }),
    async function (req, res, next) {
      let { nom, userName, password, prenom, email } = req.body;
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        if (email.length < 6) {
          res
            .status(403)
            .send(
              `Invalid email, " ${email} " length is too short or not an email ! `
            );
        }
        if (userName.length < 5) {
          res
            .status(403)
            .send(
              `userName ${userName} length is too short (it needs to have at least 5 characters) ! `
            );
        } else {
          res.status(403).send(`This string ${email} is not an email `);
        }
        return;
      }
      userName = userName.toLowerCase();
      email = email.toLowerCase();
      try {
        const hash = await argon.hash(password);
        var user = await prisma.user.create({
          data: {
            nom,
            userName,
            hash,
            prenom,
            email,
          },
        });
        delete user.hash;
        var token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET_KEY, {
          expiresIn: '5h',
        });

        // Sending Confirmation email
        link = `http://${req.hostname}:3000/users/confirm/${user.id}`;
        let mailOptions = {
          // from:'makaveli.dogg2017@gmail.com',
          to: user.email,
          subject: 'Email confirmation',
          html: `<h3>Email confirmation for ${user.userName}</h3> <br/>
          <a href=${link} style=" style="background-color: turquoise; border: none; border-radius: 5px; color: #333; /* Dark grey */ padding: 15px 32px"">Click to confirm your account</a>`,
        };
        let info = await transporter.sendMail(mailOptions);
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
    }
  )
  .put('/', (req, res, next) => {
    res
      .status(405)
      .setHeader('Content-Type', 'application/json')
      .json({ msg: 'Put method is not supported on this endpoint !!' });
  })

  .get(
    '/confirm/:id',
    auth.verifyToken,
    auth.userPermission,
    async (req, res, next) => {
      var { user_id } = req.user;
      id = +user_id;
      var user = await prisma.user.update({
        where: { id },
        data: {
          isConfirmed: true,
        },
      });
      if (!user) {
        res.status(404).send(`This user doesn't exist !! `);
      }
      delete user.hash;
      res.send(user);
    }
  )
  .get(
    '/:id',
    auth.verifyToken,
    auth.userPermission,
    async (req, res, next) => {
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
    }
  )
  .put(
    '/:id',
    auth.verifyToken,
    auth.userPermission,
    async (req, res, next) => {
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
    }
  );

module.exports = router;
