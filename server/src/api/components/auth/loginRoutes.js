const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();
const User = require('../user/model.js');
const db = require('../db.js');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function fetchUser(username, password) {
  //Find the user by username and populate the focalpoints and insights fields
  const user = await User.findOne({ username: username })
  console.log('user: ', user)
  return user;
}

async function checkPassword(password, hashedPassword) {
  //Check if the password is valid
  const validPassword = await bcrypt.compare(password, hashedPassword);
  if (!validPassword) {
    throw new Error('Invalid password');
  }

  return true;
}

router.post('/', async (req, res) => {
  console.log('Got a POST request at /login');
  console.log('req.body: ', req.body);

  try {
    //1. Find the user by username or email, check if the password is valid
    const foundUser = await fetchUser(req.body.username, req.body.password);

    //2. Edge case: Check if the focalpoints or pinned_insights fields are empty
    /*if (foundUser.focalpoints === undefined || foundUser.pinned_insights === undefined) {
      const user = {
        username: foundUser.username,
        email: foundUser.email,
        focalpoints: foundUser.focalpoints,
        pinned_insights: foundUser.pinned_insights,
        isAuthenticated: true,
      }
      return res.status(200).json({ user });
    }*/
    //3. Check if valid password
    const validPassword = await checkPassword(req.body.password, foundUser.password);
    if (!validPassword) {
      return res.status(401).send('Invalid password');
    }

    //3. Return the authenticated user with populated fields
    const user = {
      username: foundUser.username,
      email: foundUser.email,
      focalpoints: foundUser.focalpoints,
      pinned_insights: foundUser.pinned_insights,
      avatar: foundUser.avatar,
      subscriptions: foundUser.subscriptions,
      isAuthenticated: true,
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.log('Error: ', error);
    return res.status(400).send(error.message);
  }
});


module.exports = router;
