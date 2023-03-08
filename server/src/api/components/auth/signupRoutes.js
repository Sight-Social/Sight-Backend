const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();
const User = require('../user/model.js');
const db = require('../db.js');
const bcrypt = require('bcrypt');

router.post('/:username', async (req, res) => {
  console.log('Got a GET request at /signup/:username');
  console.log('req.params: ', req.params);
});

router.post('/', async (req, res) => {
  console.log('Got a POST request at /signup');
  console.log('req.body: ', req.body);
  //1. Check if user already exists
  try {
    const existingUser = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.email }],
    });
    if (existingUser) {
      console.log('User already exists');
      res.send({ isAuthenticated: false });
      return res.status(400).send('User already exists');
    }
  } catch (error) {
    res.send(`Error searching for an existing user from the database: ${error}`);
  }
  //2. If user doesn't exist, create a new User
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const savedUser = await User.create({
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email,
        googleId: '',
        avater: '',
        focalpoints: [
          {
            title: 'Focalpoint 1',
            description: 'This is a default focalpoint, delete it and add your own!',
            insights: [],
          },
          {
            title: 'Focalpoint 2',
            description: 'This is a default focalpoint, delete it and add your own!',
            insights: [],
          }
        ],
        pinned_insights: [],
        subscriptions: []
    });
    //3. Send back the newly created user
    const userToSend = { ...savedUser.toObject(), isAuthenticated: true};
    console.log('userToSend: ', userToSend);
    res.send(userToSend);
  } catch (error) {
    res.status(500).send(`Error posting or fetching newly created user from the database: ${error}`);
  }
});

module.exports = router;
